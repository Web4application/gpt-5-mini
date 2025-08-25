import Foundation

/// Very small, file-backed vector store for personal corpora.
/// Persists as JSON mapping: "<uuid-string>" -> [Double]
final class VectorStore {
    static let shared = VectorStore()
    private init() { loadFromDisk() }

    private var index: [UUID: [Double]] = [:]
    private let fileName = "vectors.json"

    private var fileURL: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent(fileName)
    }

    // Upsert vector for a transcript ID
    func upsert(id: UUID, vector: [Double]) {
        index[id] = vector
        persist()
    }

    // Remove a vector by id
    func remove(id: UUID) {
        index.removeValue(forKey: id)
        persist()
    }

    // Clear everything (use with care)
    func clearAll() {
        index.removeAll()
        persist()
    }

    // Brute-force top-K cosine similarity (suitable for small corpora)
    func topK(queryVector: [Double], k: Int = 5) -> [(UUID, Double)] {
        var results: [(UUID, Double)] = []
        for (id, vec) in index {
            guard vec.count == queryVector.count else { continue }
            let sim = cosineSimilarity(a: queryVector, b: vec)
            results.append((id, sim))
        }
        results.sort { $0.1 > $1.1 }
        return Array(results.prefix(k))
    }

    // MARK: Persistence
    private func persist() {
        DispatchQueue.global(qos: .background).async {
            var dict: [String: [Double]] = [:]
            for (k, v) in self.index { dict[k.uuidString] = v }
            if let data = try? JSONSerialization.data(withJSONObject: dict, options: []) {
                try? data.write(to: self.fileURL, options: .atomic)
            }
        }
    }

    private func loadFromDisk() {
        guard let data = try? Data(contentsOf: fileURL) else { index = [:]; return }
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: [Double]] else { index = [:]; return }
        var out: [UUID: [Double]] = [:]
        for (k, v) in json {
            if let id = UUID(uuidString: k) { out[id] = v }
        }
        index = out
    }

    // MARK: Utils
    private func cosineSimilarity(a: [Double], b: [Double]) -> Double {
        var dot = 0.0, na = 0.0, nb = 0.0
        for i in 0..<a.count {
            dot += a[i] * b[i]
            na += a[i] * a[i]
            nb += b[i] * b[i]
        }
        return dot / (sqrt(na) * sqrt(nb) + 1e-12)
    }
}