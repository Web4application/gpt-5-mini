import Foundation

protocol EmbeddingServiceProtocol {
    func createEmbedding(text: String, completion: @escaping (Result<[Float], Error>) -> Void)
}

protocol VectorStoreProtocol {
    func upsert(id: UUID, vector: [Float])
    func remove(id: UUID)
    func clearAll()
}

protocol CloudSyncProtocol {
    func upload(_ t: Transcript, completion: @escaping (Result<Void, Error>) -> Void)
    func delete(_ id: UUID, completion: @escaping (Result<Void, Error>) -> Void)
}

final class TranscriptStorage {
    static let shared = TranscriptStorage()

    private let filename = "transcripts.json"
    private var cache: [Transcript]
    private let queue = DispatchQueue(label: "TranscriptStorageQueue", attributes: .concurrent)

    private let embeddingsService: EmbeddingServiceProtocol
    private let vectorStore: VectorStoreProtocol
    private let cloudSync: CloudSyncProtocol

    // MARK: - Init
    init(
        embeddingsService: EmbeddingServiceProtocol = EmbeddingsService.shared,
        vectorStore: VectorStoreProtocol = VectorStore.shared,
        cloudSync: CloudSyncProtocol = CloudKitSync.shared
    ) {
        self.embeddingsService = embeddingsService
        self.vectorStore = vectorStore
        self.cloudSync = cloudSync
        self.cache = TranscriptStorage.loadFromDisk(filename: filename)
    }

    private var fileURL: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent(filename)
    }

    // MARK: - Public API
    func load() -> [Transcript] {
        queue.sync { cache }
    }

    func save(_ t: Transcript, useEmbeddings: Bool = true, cloudSync: Bool = true) {
        queue.async(flags: .barrier) {
            self.cache.append(t)
            self.persist()
        }

        if useEmbeddings {
            embeddingsService.createEmbedding(text: t.text) { result in
                if case .success(let vec) = result {
                    self.vectorStore.upsert(id: t.id, vector: vec)
                }
            }
        }

        if cloudSync {
            self.cloudSync.upload(t) { _ in }
        }
    }

    func overwrite(_ list: [Transcript]) {
        queue.async(flags: .barrier) {
            self.cache = list
            self.persist()
        }
    }

    func delete(id: UUID) {
        queue.async(flags: .barrier) {
            self.cache.removeAll { $0.id == id }
            self.persist()
        }
        vectorStore.remove(id: id)
        cloudSync.delete(id) { _ in }
    }

    func deleteAll() {
        queue.async(flags: .barrier) {
            self.cache.removeAll()
            self.persist()
        }
        vectorStore.clearAll()
    }

    func search(_ q: String) -> [Transcript] {
        guard !q.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return load() }
        let s = q.lowercased()
        return load().filter {
            $0.text.lowercased().contains(s) ||
            ($0.gptSummary ?? "").lowercased().contains(s) ||
            ($0.gptTags ?? []).joined(separator: " ").lowercased().contains(s)
        }
    }

    // MARK: - Persistence
    private func persist() {
        do {
            let data = try JSONEncoder().encode(cache)
            try data.write(to: fileURL, options: .atomic)
        } catch {
            print("[NeuraLog] persist error:", error.localizedDescription)
        }
    }

    private static func loadFromDisk(filename: String) -> [Transcript] {
        let fileURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent(filename)
        guard let data = try? Data(contentsOf: fileURL) else { return [] }
        return (try? JSONDecoder().decode([Transcript].self, from: data)) ?? []
    }
}
