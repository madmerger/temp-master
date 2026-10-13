import CryptoKit
import Foundation

/// B-15: sign = Base64(HMAC-SHA256(secret, token + t + nonce)).
enum SwitchBotSigner {
    static func headers(token: String, secret: String,
                        timestampMs: Int64, nonce: String) -> [String: String] {
        let message = "\(token)\(timestampMs)\(nonce)"
        let key = SymmetricKey(data: Data(secret.utf8))
        let signature = HMAC<SHA256>.authenticationCode(
            for: Data(message.utf8), using: key)
        let sign = Data(signature).base64EncodedString()
        return [
            "Authorization": token,
            "Content-Type": "application/json",
            "charset": "utf8",
            "t": "\(timestampMs)",
            "sign": sign,
            "nonce": nonce,
        ]
    }
}
