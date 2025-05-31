import { useState, useEffect } from "react";
import {
  getDataCameraHistory,
  deleteDataCameraHistory,
  updateDataCameraHistory,
} from "./api";

function App() {
  const [data, setData] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("kamera");
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(5);
  const [aiData, setAiData] = useState([]);

  const dummyAiData = [

    {
      id: 1,
      nama: "Testing",
      tanggal: "2025-06-01",
      gambar: "/images/tes.jpg",
      keletihan: 15,
      mood: "Marah",
    },

    {
      id: 1,
      nama: "Asep Trisna",
      tanggal: "2025-06-01",
      gambar: "/images/asep.jpg",
      keletihan: 15,
      mood: "Sedih",
    },
    {
      id: 2,
      nama: "Iqbal Ferdana",
      tanggal: "2025-06-01",
      gambar: "/images/Iqbal.jpg",
      keletihan: 5,
      mood: "Bahagia",
    },
    {
      id: 3,
      nama: "Wawan Setiawan",
      tanggal: "2025-06-01",
      gambar: "/images/wawan.jpg",
      keletihan: 42,
      mood: "Cemas",
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getDataCameraHistory(page);
      setData(response.data);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  useEffect(() => {
    if (tab === "ai") {
      setAiData(dummyAiData);
    }
  }, [tab]);

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;
    try {
      await deleteDataCameraHistory(id);
      fetchData();
    } catch (error) {
      console.error("Gagal menghapus data:", error);
    }
  };

  const handleEdit = async () => {
    try {
      await updateDataCameraHistory(selectedPhoto.id, {
        ...selectedPhoto,
        unit: editUnit,
      });
      setSelectedPhoto(null);
      fetchData();
    } catch (error) {
      console.error("Gagal mengupdate data:", error);
    }
  };

  const filteredData = data.filter((item) =>
    item.guid_device.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isPageEmpty = !loading && filteredData.length === 0;

  return (
    // <div style={{ padding: "2rem", minHeight: "100vh" }}>
    //   <h1 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "2rem" }}>
    //     Galeri Foto
    //   </h1>

    //   <div
    //     style={{
    //       display: "grid",
    //       gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    //       gap: "1.5rem",
    //     }}
    //   >
    //     {photos.map((photo, index) => (
    //       <div
    //         key={index}
    //         style={{
    //           backgroundColor: "#fff",
    //           padding: "1rem",
    //           borderRadius: "0.75rem",
    //           boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    //           textAlign: "center",
    //         }}
    //       >
    //         <img
    //           src={`/images/${photo.fileName}`}
    //           alt={photo.fileName}
    //           onClick={() => setSelectedPhoto(photo)}
    //           style={{
    //             width: "100%",
    //             aspectRatio: "1 / 1",
    //             objectFit: "cover",
    //             borderRadius: "0.5rem",
    //             marginBottom: "0.75rem",
    //             cursor: "pointer",
    //             transition: "transform 0.3s",
    //           }}
    //           onMouseEnter={(e) =>
    //             (e.currentTarget.style.transform = "scale(1.05)")
    //           }
    //           onMouseLeave={(e) =>
    //             (e.currentTarget.style.transform = "scale(1)")
    //           }
    //         />
    //         <p style={{ fontWeight: "bold", margin: "0.25rem 0" }}>
    //           {photo.fileName}
    //         </p>
    //         <p style={{ color: "#555", margin: 0 }}>{photo.formatted}</p>
    //       </div>
    //     ))}
    //   </div>

    //   {selectedPhoto && (
    //     <div
    //       onClick={() => setSelectedPhoto(null)}
    //       style={{
    //         position: "fixed",
    //         top: 0,
    //         left: 0,
    //         width: "100vw",
    //         height: "100vh",
    //         backgroundColor: "rgba(0,0,0,0.7)",
    //         display: "flex",
    //         justifyContent: "center",
    //         alignItems: "center",
    //         zIndex: 1000,
    //       }}
    //     >
    //       <div
    //         onClick={(e) => e.stopPropagation()}
    //         style={{
    //           backgroundColor: "#fff",
    //           padding: "1rem",
    //           borderRadius: "0.5rem",
    //           textAlign: "center",
    //           maxWidth: "90vw",
    //           maxHeight: "90vh",
    //           overflow: "auto",
    //         }}
    //       >
    //         <img
    //           src={`/images/${selectedPhoto.fileName}`}
    //           alt={selectedPhoto.fileName}
    //           style={{
    //             width: "100%",
    //             maxWidth: "500px",
    //             borderRadius: "0.5rem",
    //             marginBottom: "1rem",
    //           }}
    //         />
    //         <p style={{ fontWeight: "bold" }}>{selectedPhoto.fileName}</p>
    //         <p style={{ color: "#555" }}>{selectedPhoto.formatted}</p>
    //         <a
    //           href={`/images/${selectedPhoto.fileName}`}
    //           download
    //           style={{
    //             display: "inline-block",
    //             marginTop: "0.5rem",
    //             backgroundColor: "#007bff",
    //             color: "#fff",
    //             padding: "0.5rem 1rem",
    //             borderRadius: "0.3rem",
    //             textDecoration: "none",
    //           }}
    //         >
    //           ⬇️ Download
    //         </a>
    //       </div>
    //     </div>
    //   )}
    // </div>
    <div className="p-4">
      <div className="mb-4">
        <button
          className={`px-4 py-2 mr-2 rounded ${
            tab === "kamera" ? "bg-blue-600 text-white" : "bg-gray-300"
          }`}
          onClick={() => setTab("kamera")}
        >
          Data Kamera
        </button>
        <button
          className={`px-4 py-2 rounded ${
            tab === "ai" ? "bg-blue-600 text-white" : "bg-gray-300"
          }`}
          onClick={() => setTab("ai")}
        >
          Data AI
        </button>
      </div>

      {tab === "kamera" && (
        <>
          <div className="flex items-center justify-between mb-4 gap-2">
            <input
              type="text"
              placeholder="Cari berdasarkan guid_device"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded w-full"
            />
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded whitespace-nowrap"
            >
              Refresh Data
            </button>
          </div>

          {loading ? (
            <div className="text-center text-gray-500">Loading data...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center text-gray-500">File/Gambar Belum Tersedia</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {filteredData.map((history, index) => {
                const imageUrl = `https://monja-file.pptik.id/v1/view?path=presensi/${history.gambar}`;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-4 flex flex-col gap-4 hover:shadow-xl transition-all"
                  >
                    <img
                      src={imageUrl}
                      alt={`Image ${index}`}
                      className="w-full h-52 object-cover rounded-lg cursor-pointer"
                      onClick={() => {
                        setSelectedPhoto(history);
                        setEditUnit(history.unit || "");
                      }}
                    />
                    <div>
                      <h1 className="font-bold">{history.guid_device}</h1>
                      <h2 className="text-xs mb-2">{history.datetime}</h2>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedPhoto(history);
                            setEditUnit(history.unit || "");
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => handleDelete(history.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col items-center mt-6 gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border bg-white"
              >
                Sebelumnya
              </button>
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded border ${
                    page === p ? "bg-blue-600 text-white" : "bg-white"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border bg-white"
              >
                Berikutnya
              </button>
            </div>
            <p className="text-sm text-gray-500">Halaman {page} dari {totalPages}</p>
          </div>

          {selectedPhoto && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Detail Gambar</h2>
                <img
                  src={`https://monja-file.pptik.id/v1/view?path=presensi/${selectedPhoto.gambar}`}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded mb-4"
                />
                <p><strong>ID:</strong> {selectedPhoto.id}</p>
                <p><strong>GUID:</strong> {selectedPhoto.guid}</p>
                <p><strong>Device:</strong> {selectedPhoto.guid_device}</p>
                <p><strong>Datetime:</strong> {selectedPhoto.datetime}</p>
                <p><strong>Unit:</strong></p>
                <input
                  type="text"
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="border px-2 py-1 w-full mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="px-4 py-2 bg-gray-300 rounded"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "ai" && (
        <div>
          {aiData.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">Data AI belum tersedia.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {aiData.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-3xl p-4 flex flex-col items-center shadow hover:shadow-lg transition-all"
                >
                  <img
                    src={item.gambar}
                    alt={item.nama}
                    className="w-24 h-24 rounded-xl object-cover mb-3"
                    onError={(e) => {
                      e.target.src = "/images/fallback.jpg";
                    }}
                  />
                  <h1 className="font-bold text-center">{item.nama}</h1>
                  <p className="text-sm text-gray-600 mb-3">
                    {new Date(item.tanggal).toLocaleDateString("id-ID")}
                  </p>

                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="bg-red-600 text-white text-xs px-3 py-1 rounded">
                      KELETIHAN
                    </span>
                    <span className="border text-xs px-3 py-1 rounded">
                      {item.keletihan} %
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <span className="bg-blue-400 text-white text-xs px-3 py-1 rounded">
                      Suasana Hati
                    </span>
                    <span className="bg-yellow-200 text-xs px-3 py-1 rounded">
                      {item.mood}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;