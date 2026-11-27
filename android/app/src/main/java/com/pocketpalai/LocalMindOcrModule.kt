package com.pocketpal

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import com.googlecode.tesseract.android.TessBaseAPI
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.InputStream
import kotlin.math.min
import kotlin.math.roundToInt

@ReactModule(name = LocalMindOcrModule.NAME)
class LocalMindOcrModule(
  private val context: ReactApplicationContext,
) : ReactContextBaseJavaModule(context) {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
  private val ocrMutex = Mutex()

  override fun getName(): String = NAME

  @ReactMethod
  fun recognizeImage(uri: String, promise: Promise) {
    scope.launch {
      ocrMutex.withLock {
        var api: TessBaseAPI? = null
        var bitmap: Bitmap? = null
        try {
          api = createTessApi()
          bitmap = decodeImage(uri)
          api.setImage(bitmap)
          promise.resolve(api.getUTF8Text().orEmpty().trim())
        } catch (error: Throwable) {
          promise.reject("OCR_IMAGE_FAILED", error)
        } finally {
          bitmap?.recycle()
          api?.recycle()
        }
      }
    }
  }

  @ReactMethod
  fun recognizePdf(uri: String, promise: Promise) {
    scope.launch {
      ocrMutex.withLock {
        var api: TessBaseAPI? = null
        var descriptor: ParcelFileDescriptor? = null
        var renderer: PdfRenderer? = null
        try {
          api = createTessApi()
          descriptor = openPdfDescriptor(uri)
          renderer = PdfRenderer(descriptor)
          if (renderer.pageCount <= 0) {
            throw IllegalArgumentException("The PDF contains no pages.")
          }

          val pagesToRead = min(renderer.pageCount, MAX_PDF_PAGES)
          val result = StringBuilder()
          for (index in 0 until pagesToRead) {
            val page = renderer.openPage(index)
            try {
              val scale = min(1.5f, 1800f / maxOf(page.width, page.height).toFloat())
              val width = (page.width * scale).roundToInt().coerceAtLeast(1)
              val height = (page.height * scale).roundToInt().coerceAtLeast(1)
              val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
              try {
                page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                api.setImage(bitmap)
                val pageText = api.getUTF8Text().orEmpty().trim()
                if (pageText.isNotEmpty()) {
                  if (result.isNotEmpty()) result.append("\n\n")
                  result.append("Страница ${index + 1}:\n").append(pageText)
                }
              } finally {
                bitmap.recycle()
              }
            } finally {
              page.close()
            }
          }
          if (renderer.pageCount > pagesToRead) {
            result.append("\n\nОбработаны первые ${pagesToRead} страниц из ${renderer.pageCount}.")
          }
          promise.resolve(result.toString().trim())
        } catch (error: Throwable) {
          promise.reject("OCR_PDF_FAILED", error)
        } finally {
          api?.recycle()
          renderer?.close()
          descriptor?.close()
        }
      }
    }
  }

  private fun createTessApi(): TessBaseAPI {
    val root = File(context.filesDir, "localmind-ocr")
    val tessdata = File(root, "tessdata")
    if (!tessdata.exists() && !tessdata.mkdirs()) {
      throw IllegalStateException("Could not create the OCR data directory.")
    }

    listOf("rus", "eng").forEach { language ->
      val target = File(tessdata, "${language}.traineddata")
      if (!target.exists() || target.length() < MIN_TESSDATA_BYTES) {
        val temporary = File(tessdata, "${language}.traineddata.part")
        context.assets.open("tessdata/${language}.traineddata").use { input ->
          FileOutputStream(temporary).use { output -> input.copyTo(output) }
        }
        if (temporary.length() < MIN_TESSDATA_BYTES) {
          temporary.delete()
          throw IllegalStateException("OCR language data for ${language} is incomplete.")
        }
        if (target.exists()) target.delete()
        if (!temporary.renameTo(target)) {
          throw IllegalStateException("Could not install OCR language data for ${language}.")
        }
      }
    }

    val api = TessBaseAPI()
    if (!api.init(root.absolutePath, "rus+eng")) {
      api.recycle()
      throw IllegalStateException("Could not initialize the offline OCR engine.")
    }
    return api
  }

  private fun openInputStream(value: String): InputStream {
    val uri = Uri.parse(value)
    return when (uri.scheme) {
      "file" -> FileInputStream(File(uri.path ?: throw IllegalArgumentException("Invalid image path.")))
      "content" -> context.contentResolver.openInputStream(uri)
        ?: throw IllegalArgumentException("Could not open the selected image.")
      else -> FileInputStream(File(value))
    }
  }

  private fun decodeImage(value: String): Bitmap {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    openInputStream(value).use { BitmapFactory.decodeStream(it, null, bounds) }
    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) {
      throw IllegalArgumentException("The selected image could not be decoded.")
    }

    var sampleSize = 1
    while (maxOf(bounds.outWidth, bounds.outHeight) / sampleSize > MAX_IMAGE_DIMENSION) {
      sampleSize *= 2
    }
    val options = BitmapFactory.Options().apply { inSampleSize = sampleSize }
    return openInputStream(value).use { BitmapFactory.decodeStream(it, null, options) }
      ?: throw IllegalArgumentException("The selected image could not be decoded.")
  }

  private fun openPdfDescriptor(value: String): ParcelFileDescriptor {
    val uri = Uri.parse(value)
    return if (uri.scheme == "file") {
      ParcelFileDescriptor.open(
        File(uri.path ?: throw IllegalArgumentException("Invalid PDF path.")),
        ParcelFileDescriptor.MODE_READ_ONLY,
      )
    } else {
      context.contentResolver.openFileDescriptor(uri, "r")
        ?: throw IllegalArgumentException("Could not open the selected PDF.")
    }
  }

  companion object {
    const val NAME = "LocalMindOcr"
    private const val MAX_PDF_PAGES = 20
    private const val MAX_IMAGE_DIMENSION = 1800
    private const val MIN_TESSDATA_BYTES = 1_000_000L
  }
}
