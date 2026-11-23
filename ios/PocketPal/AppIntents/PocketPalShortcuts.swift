//
//  PocketPalShortcuts.swift
//  LocalMind
//
//  App Shortcuts provider for LocalMind
//

import Foundation
import AppIntents

@available(iOS 16.0, *)
struct PocketPalShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        [
            AppShortcut(
                intent: AskPalIntent(),
                phrases: [
                    "Ask \(.applicationName)",
                    "Ask my \(.applicationName) assistant",
                    "Question for \(.applicationName)",
                ],
                shortTitle: "Ask Assistant",
                systemImageName: "message.fill"
            ),
            AppShortcut(
                intent: OpenPalChatIntent(),
                phrases: [
                    "Open \(.applicationName) chat",
                    "Chat with my assistant in \(.applicationName)",
                    "Start \(.applicationName) conversation",
                ],
                shortTitle: "Open Chat",
                systemImageName: "bubble.left.and.bubble.right.fill"
            ),
        ]
    }
}
