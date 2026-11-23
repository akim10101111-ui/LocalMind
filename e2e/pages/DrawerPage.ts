/** Drawer/navigation page object for the LocalMind sidebar. */
import {BasePage, ChainableElement} from './BasePage';
import {Selectors, byPartialText} from '../helpers/selectors';

declare const browser: WebdriverIO.Browser;

export class DrawerPage extends BasePage {
  get modelsTab(): ChainableElement { return this.getElement(Selectors.drawer.modelsTab); }
  get chatTab(): ChainableElement { return this.getElement(Selectors.drawer.chatTab); }

  async isOpen(): Promise<boolean> {
    return this.isElementDisplayed(Selectors.drawer.container, 3000);
  }

  async waitForOpen(timeout = 10000): Promise<void> {
    await this.waitForElement(Selectors.drawer.container, timeout);
  }

  async waitForClose(timeout = 5000): Promise<void> {
    await this.waitForElementToDisappear(Selectors.drawer.container, timeout);
  }

  async navigateToChat(): Promise<void> {
    await this.waitForOpen();
    await this.tap(Selectors.drawer.chatTab);
    await browser.pause(300);
    await this.waitForClose();
  }

  async navigateToModels(): Promise<void> {
    await this.waitForOpen();
    await this.tap(Selectors.drawer.modelsTab);
    await browser.pause(300);
    await this.waitForClose();
  }

  async tapSession(titleFragment: string): Promise<void> {
    await this.waitForOpen();
    await this.tap(byPartialText(titleFragment));
    await browser.pause(300);
    await this.waitForClose();
  }

  async navigateToSettings(): Promise<void> {
    await this.waitForOpen();
    await this.tap(Selectors.drawer.settingsTab);
    await browser.pause(300);
    await this.waitForClose();
  }
}
