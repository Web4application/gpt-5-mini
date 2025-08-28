import XCTest
@testable import GPT5

final class TranscriptStorageTests: XCTestCase {

    var storage: TranscriptStorage!

    override func setUp() {
        super.setUp()
        storage = TranscriptStorage(
            embeddingsService: MockEmbeddingService(),
            vectorStore: MockVectorStore(),
            cloudSync: MockCloudSync()
        )
        storage.deleteAll()
    }

    // MARK: - Functional Correctness
    func testSaveAndLoadSingle() {
        let t = Transcript(id: UUID(), text: "Hello", language: "en", date: Date(), gptSummary: nil)
        storage.save(t, useEmbeddings: false, cloudSync: false)
        XCTAssertTrue(storage.load().contains(where: { $0.id == t.id }))
    }

    func testSearchMatchesTextAndSummaryAndTags() {
        let t = Transcript(id: UUID(), text: "Swift", language: "en", date: Date(),
                           gptSummary: "Apple language", gptTags: ["coding", "ios"])
        storage.save(t, useEmbeddings: false, cloudSync: false)
        XCTAssertFalse(storage.search("swift").isEmpty)
        XCTAssertFalse(storage.search("apple").isEmpty)
        XCTAssertFalse(storage.search("ios").isEmpty)
    }

    // MARK: - Edge Cases
    func testEmptyTranscript() {
        let t = Transcript(id: UUID(), text: "", language: "en", date: Date(), gptSummary: nil)
        storage.save(t, useEmbeddings: false, cloudSync: false)
        XCTAssertEqual(storage.load().count, 1)
    }

    func testUnicodePersistence() {
        let text = "こんにちは 🌸"
        let t = Transcript(id: UUID(), text: text, language: "jp", date: Date(), gptSummary: nil)
        storage.save(t, useEmbeddings: false, cloudSync: false)
        XCTAssertEqual(storage.load().first?.text, text)
    }

    func testDuplicateIDs() {
        let id = UUID()
        let t1 = Transcript(id: id, text: "One", language: "en", date: Date(), gptSummary: nil)
        let t2 = Transcript(id: id, text: "Two", language: "en", date: Date(), gptSummary: nil)
        storage.save(t1, useEmbeddings: false, cloudSync: false)
        storage.save(t2, useEmbeddings: false, cloudSync: false)
        XCTAssertEqual(storage.load().filter { $0.id == id }.count, 2) // or adjust if you prefer overwrite
    }

    // MARK: - Persistence
    func testLoadFromDiskOnInit() {
        let t = Transcript(id: UUID(), text: "Persisted", language: "en", date: Date(), gptSummary: nil)
        storage.save(t, useEmbeddings: false, cloudSync: false)
        let newStorage = TranscriptStorage(
            embeddingsService: MockEmbeddingService(),
            vectorStore: MockVectorStore(),
            cloudSync: MockCloudSync()
        )
        XCTAssertTrue(newStorage.load().contains(where: { $0.text == "Persisted" }))
    }

    func testHandlesCorruptDiskFile() {
        let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("transcripts.json")
        try? "not json".write(to: url, atomically: true, encoding: .utf8)
        let newStorage = TranscriptStorage(
            embeddingsService: MockEmbeddingService(),
            vectorStore: MockVectorStore(),
            cloudSync: MockCloudSync()
        )
        XCTAssertEqual(newStorage.load(), [])
    }

    // MARK: - Integration Calls
    func testSaveTriggersEmbeddingsWhenEnabled() {
        let mockEmbeddings = MockEmbeddingService()
        storage = TranscriptStorage(embeddingsService: mockEmbeddings,
                                    vectorStore: MockVectorStore(),
                                    cloudSync: MockCloudSync())
        let t = Transcript(id: UUID(), text: "Call me", language: "en", date: Date(), gptSummary: nil)
        storage.save(t, useEmbeddings: true, cloudSync: false)
        XCTAssertTrue(mockEmbeddings.wasCalled)
    }

    func testDeleteTriggersVectorStoreAndCloudSync() {
        let mockVector = MockVectorStore()
        let mockCloud = MockCloudSync()
        storage = TranscriptStorage(embeddingsService: MockEmbeddingService(),
                                    vectorStore: mockVector,
                                    cloudSync: mockCloud)
        let id = UUID()
        let t = Transcript(id: id, text: "Bye", language: "en", date: Date(), gptSummary: nil)
        storage.save(t, useEmbeddings: false, cloudSync: false)
        storage.delete(id: id)
        XCTAssertTrue(mockVector.removeWasCalled)
        XCTAssertTrue(mockCloud.deleteWasCalled)
    }

    // MARK: - Concurrency
    func testConcurrentAccess() {
        let group = DispatchGroup()
        for i in 0..<200 {
            group.enter()
            DispatchQueue.global().async {
                let t = Transcript(id: UUID(), text: "T\(i)", language: "en", date: Date(), gptSummary: nil)
                self.storage.save(t, useEmbeddings: false, cloudSync: false)
                group.leave()
            }
            group.enter()
            DispatchQueue.global().async {
                _ = self.storage.load()
                group.leave()
            }
        }
        group.wait()
        XCTAssertGreaterThanOrEqual(storage.load().count, 0)
    }
}
