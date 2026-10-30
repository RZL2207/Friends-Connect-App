import Foundation
import CallKit
import AVFoundation

class CallKitManager: NSObject, ObservableObject {
    static let shared = CallKitManager()

    private let provider: CXProvider
    private let callController = CXCallController()
    @Published var activeCallUUID: UUID?

    override private init() {
        let configuration = CXProviderConfiguration()
        configuration.supportsVideo = true
        configuration.maximumCallsPerCallGroup = 1
        configuration.supportedHandleTypes = [.generic]
        configuration.includesCallsInRecents = true

        provider = CXProvider(configuration: configuration)
        super.init()
        provider.setDelegate(self, queue: nil)
    }

    // Report incoming call to iOS system (Rings lock-screen like a real phone call)
    func reportIncomingCall(uuid: UUID = UUID(), callerName: String, hasVideo: Bool = false, completion: ((Error?) -> Void)? = nil) {
        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: callerName)
        update.localizedCallerName = callerName
        update.hasVideo = hasVideo
        update.supportsDTMF = false
        update.supportsHolding = false
        update.supportsGrouping = false
        update.supportsUngrouping = false

        provider.reportNewIncomingCall(with: uuid, update: update) { [weak self] error in
            if error == nil {
                self?.activeCallUUID = uuid
            }
            completion?(error)
        }
    }

    // Start outgoing call
    func startCall(uuid: UUID = UUID(), handle: String, video: Bool = false) {
        let handleObj = CXHandle(type: .generic, value: handle)
        let startCallAction = CXStartCallAction(call: uuid, handle: handleObj)
        startCallAction.isVideo = video

        let transaction = CXTransaction(action: startCallAction)
        callController.request(transaction) { error in
            if let error = error {
                print("Failed to start CallKit call: \(error.localizedDescription)")
            }
        }
    }

    // End active call
    func endCall() {
        guard let uuid = activeCallUUID else { return }
        let endAction = CXEndCallAction(call: uuid)
        let transaction = CXTransaction(action: endAction)
        callController.request(transaction) { [weak self] error in
            if error == nil {
                self?.activeCallUUID = nil
            }
        }
    }
}

extension CallKitManager: CXProviderDelegate {
    func providerDidReset(_ provider: CXProvider) {
        activeCallUUID = nil
    }

    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        // Activate audio session for WebRTC
        try? AVAudioSession.sharedInstance().setCategory(.playAndRecord, mode: .voiceChat)
        try? AVAudioSession.sharedInstance().setActive(true)
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        try? AVAudioSession.sharedInstance().setActive(false)
        activeCallUUID = nil
        action.fulfill()
    }
}
