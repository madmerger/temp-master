import SwiftUI

extension String {
    /// For SwiftUI views accepting LocalizedStringKey.
    var localized: LocalizedStringKey { LocalizedStringKey(self) }

    /// For contexts needing a resolved String (view models, alerts, accessibility).
    var localizedString: String {
        NSLocalizedString(self, comment: "\(self)_comment")
    }
}
