import { useState, useEffect } from "react";
import {
  getDataCameraHistory,
  deleteDataCameraHistory,
  updateDataCameraHistory,
} from "./api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { getAllCameraHistories } from "./ai";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer
} from "recharts";

function App() {
  const [data, setData] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editUnit, setEditUnit] = useState("User");
  const [page, setPage] = useState(1);
  const [dashboardPage, setDashboardPage] = useState(1);
  const itemsPerPage = 10;
  const maxDashboardPages = 5;
  const [tab, setTab] = useState("kamera");
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(5);
  const [aiData, setAiData] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dataHistoriesAi, setDataHistoriesAi] = useState([])

  const getDataHistoriesAi = async () => {
    try {
      const response = await getAllCameraHistories(page)
      setDataHistoriesAi(response)
    } catch (error) {
      console.log(error)
    }
  }

  const handleRefreshAi = async () => {
  try {
    await getDataHistoriesAi();
    setPage(1); // reset halaman ke awal
    await getDataHistoriesAi(); // Ambil data terbaru dari server
  } catch (error) {
    console.error("Gagal refresh:", error);
  }
};

  useEffect(() => {
    getDataHistoriesAi()
  }, [])

  const dummyAiData = [
    {
      id: 1,
      nama: "Testing",
      tanggal: "2025-06-01",
      gambar: "/images/tes.jpg",
      keletihan: 15,
      mood: "Bahagia",
    },
    {
      id: 2,
      nama: "Asep Trisna",
      tanggal: "2025-06-01",
      gambar: "/images/asep.jpg",
      keletihan: 70,
      mood: "Marah",
    },
    {
      id: 3,
      nama: "Iqbal Ferdana",
      tanggal: "2025-06-01",
      gambar: "/images/Iqbal.jpg",
      keletihan: 15,
      mood: "Netral",
    },
    {
      id: 4,
      nama: "Wawan Setiawan",
      tanggal: "2025-06-01",
      gambar: "/images/wawan.jpg",
      keletihan: 15,
      mood: "Sedih",
    },
    {
      id: 5,
      nama: "Kunto Aji Gits",
      tanggal: "2025-06-4",
      gambar: "/images/kuntoaji.jpg",
      keletihan: 90,
      mood: "Bahagia",
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
  if (tab === "ai") {
    setAiData(dummyAiData);
  }
  if (tab === "dashboard") {
    getDataHistoriesAi();
  }
}, [tab]);

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(dashboardData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Kamera");
    XLSX.writeFile(workbook, "data_kamera.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [["Nama", "GUID Device", "Tanggal", "Unit", "Keletihan", "Suasana Hati"]],
      body: dashboardData.map((item) => [
        item.nama || "-",
        item.guid_device,
        item.datetime,
        item.unit || "-",
        item.keletihan || "-",
        item.mood || "-",
      ]),
    });
    doc.save("data_kamera.pdf");
  };

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
      setMessage("✅ Perubahan berhasil disimpan");
      setError("");
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Gagal mengupdate data:", error);
      setError("❌ Gagal menyimpan perubahan.");
      setMessage("");
      setTimeout(() => setError(""), 3000);
    }
  };

  const filteredData = data.filter((item) =>
    item.guid_device.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.nama || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dashboardData = filteredData.slice(
    (dashboardPage - 1) * itemsPerPage,
    dashboardPage * itemsPerPage
  );

  const grafikData = dataHistoriesAi
    .filter(item => item.nama === selectedPhoto?.nama)
    .map(item => ({
      tanggal: item.datetime?.slice(0, 10),
      keletihan: item.keletihan,
      mood: item.mood
    }));

    const grafikMood = Object.entries(
    dataHistoriesAi
      .filter(item => item.nama === selectedPhoto?.nama)
      .reduce((acc, curr) => {
        acc[curr.mood] = (acc[curr.mood] || 0) + 1;
        return acc;
      }, {})
  ).map(([mood, count]) => ({ mood, count }));

  return (
    












    
 <div className="p-4">
      {/* Notifikasi */}
      {(message || error) && (
        <div className={`mb-4 px-4 py-2 rounded text-white ${message ? "bg-green-500" : "bg-red-500"}`}>
          {message || error}
        </div>
      )}

      {/* Tab Menu */}
      <div className="mb-4 flex gap-2">
        <button className={`px-4 py-2 rounded ${tab === "kamera" ? "bg-blue-600 text-white" : "bg-gray-300"}`} onClick={() => setTab("kamera")}>Data Kamera</button>
        <button className={`px-4 py-2 rounded ${tab === "ai" ? "bg-blue-600 text-white" : "bg-gray-300"}`} onClick={() => setTab("ai")}>Data AI</button>
        <button className={`px-4 py-2 rounded ${tab === "dashboard" ? "bg-blue-600 text-white" : "bg-gray-300"}`} onClick={() => setTab("dashboard")}>Dashboard</button>
      </div>

      {/* Tab Kamera */}
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
            <button onClick={fetchData} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded whitespace-nowrap">
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
                  <div key={index} className="bg-white rounded-xl p-4 flex flex-col gap-4 hover:shadow-xl transition-all">
                    <img
                      src={imageUrl}
                      alt={`Image ${index}`}
                      className="w-full h-52 object-cover rounded-lg cursor-pointer"
                      onClick={() => {
                        setSelectedPhoto(history);
                        setEditUnit(history.unit || "User");
                      }}
                    />
                    <div>
                      <h1 className="font-bold">{history.guid_device}</h1>
                      <h2 className="text-xs mb-2">{history.datetime}</h2>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          setSelectedPhoto(history);
                          setEditUnit(history.unit || "User");
                        }} className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded">Detail</button>
                        <button onClick={() => handleDelete(history.id)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded">Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Navigasi Kamera */}
          <div className="flex flex-col items-center mt-6 gap-2">
            <div className="flex gap-2">
              <button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1} className="px-3 py-1 rounded border bg-white">Sebelumnya</button>
              {[1, 2, 3, 4, 5].map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded border ${page === p ? "bg-blue-600 text-white" : "bg-white"}`}>{p}</button>
              ))}
              <button onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={page === totalPages} className="px-3 py-1 rounded border bg-white">Berikutnya</button>
            </div>
            <p className="text-sm text-gray-500">Halaman {page} dari {totalPages}</p>
          </div>
        </>
      )}

      {/* Tab Dashboard */}
      {tab === "dashboard" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <input type="text" placeholder="Cari nama atau guid_device" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-4 py-2 border rounded w-full mr-4" />
            <div className="flex gap-2">
              <button onClick={handleExportExcel} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded">Export Excel</button>
              <button onClick={handleExportPDF} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded">Export PDF</button>
            </div>
          </div>

          {dashboardData.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">Data Belum Tersedia</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-2 border">Nama</th>
                    <th className="p-2 border">GUID Device</th>
                    <th className="p-2 border">Tanggal</th>
                    <th className="p-2 border">Unit</th>
                    <th className="p-2 border">Keletihan</th>
                    <th className="p-2 border">Suasana Hati</th>
                    <th className="p-2 border">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.map((item, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="p-2 border">{item.nama || "-"}</td>
                      <td className="p-2 border">{item.guid_device}</td>
                      <td className="p-2 border">{item.datetime}</td>
                      <td className="p-2 border">{item.unit || "-"}</td>
                      <td className="p-2 border">{item.keletihan || "-"} %</td>
                      <td className="p-2 border">{item.mood || "-"}</td>
                      <td className="p-2 border">
                        <button onClick={() => {
                          setSelectedPhoto(item);
                          setEditUnit(item.unit || "User");
                        }} className="text-xs text-blue-600 underline">Detail</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Navigasi Dashboard */}
          <div className="flex flex-col items-center mt-6 gap-2">
            <div className="flex gap-2">
              <button onClick={() => setDashboardPage((prev) => Math.max(prev - 1, 1))} disabled={dashboardPage === 1} className="px-3 py-1 rounded border bg-white">Sebelumnya</button>
              {[1, 2, 3, 4, 5].map((p) => (
                <button key={p} onClick={() => setDashboardPage(p)} className={`px-3 py-1 rounded border ${dashboardPage === p ? "bg-blue-600 text-white" : "bg-white"}`}>{p}</button>
              ))}
              <button onClick={() => setDashboardPage((prev) => Math.min(prev + 1, maxDashboardPages))} disabled={dashboardPage === maxDashboardPages} className="px-3 py-1 rounded border bg-white">Berikutnya</button>
            </div>
            <p className="text-sm text-gray-500">Halaman {dashboardPage} dari {maxDashboardPages}</p>
          </div>
        </>
      )}


      {tab === "ai" && (
  <>
    {/* Filter dan Refresh Data */}
    <div className="flex items-center justify-between mb-4 gap-2">
      <input
        type="text"
        placeholder="Cari nama, tanggal, bulan..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="px-4 py-2 border rounded w-1/3"
      />
      <input
        type="month"
        onChange={(e) => setSearchTerm(e.target.value)} 
        className="px-4 py-2 border rounded w-1/3"
      />
      <button
        onClick={getDataHistoriesAi}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded whitespace-nowrap"
      >
        Refresh Data
      </button>
    </div>

    {dataHistoriesAi.length === 0 ? (
      <div className="text-center text-gray-500 mt-10">Data Belum Tersedia</div>
    ) : (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {dataHistoriesAi
            .filter(item => {
              const namaMatch = item.nama?.toLowerCase().includes(searchTerm.toLowerCase());
              const tanggal = item.datetime?.slice(0, 10) || "";
              const bulan = item.datetime?.slice(0, 7) || "";
              const filter = searchTerm.toLowerCase();
              return namaMatch || tanggal.includes(filter) || bulan.includes(filter);
            })
            .slice((page - 1) * itemsPerPage, page * itemsPerPage)
            .map((data, index) => {
              const moodColors = {
                senang: "bg-green-500",
                sedih: "bg-yellow-400",
                netral: "bg-blue-500",
                marah: "bg-red-500",
              };
              const moodLower = data.mood?.toLowerCase() || "";
              return (
                <div key={index} className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition relative cursor-pointer">
                  <img
                    src={`https://monja-file.pptik.id/v1/view?path=presensi/${data.gambar}`}
                    alt="Preview"
                    className="w-full h-52 object-cover rounded mb-4"
                    onClick={() => {
                      setSelectedPhoto(data);
                      setEditUnit(data.unit || "User");
                    }}
                  />
                  <p><strong>Nama:</strong> {data.nama}</p>
                  <p><strong>Tanggal:</strong> {data.datetime?.slice(0, 10)}</p>
                  <p><strong>Keletihan:</strong> {data.keletihan}%</p>
                  <p>
                    <strong>Suasana Hati:</strong>{" "}
                    <span
                      className={`inline-block px-2 py-1 rounded text-white text-xs ${
                        moodColors[moodLower] || "bg-gray-400"
                      }`}
                    >
                      {data.mood}
                    </span>
                  </p>
                  {/* Tombol Edit & Delete di kanan bawah */}
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <button
                      onClick={() => {
                        setSelectedPhoto(data);
                        setEditUnit(data.unit || "User");
                      }}
                      className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700"
                      title="Edit Detail"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm("Yakin ingin menghapus data ini?")) {
                          try {
                            await deleteDataCameraHistory(data.id);
                            getDataHistoriesAi();
                          } catch (error) {
                            alert("Gagal menghapus data.");
                          }
                        }
                      }}
                      className="bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700"
                      title="Delete Data"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
        </div>


        {/* Pagination AI */}
        <div className="flex flex-col items-center mt-6 gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border bg-white"
            >
              Sebelumnya
            </button>
            {Array.from({ length: Math.ceil(dataHistoriesAi.length / itemsPerPage) }, (_, i) => i + 1).map((p) => (
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
              onClick={() => setPage((prev) => Math.min(prev + 1, Math.ceil(dataHistoriesAi.length / itemsPerPage)))}
              disabled={page === Math.ceil(dataHistoriesAi.length / itemsPerPage)}
              className="px-3 py-1 rounded border bg-white"
            >
              Berikutnya
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Halaman {page} dari {Math.ceil(dataHistoriesAi.length / itemsPerPage)}
          </p>
        </div>
      </>
    )}
  </>
)}
    {/* Modal Detail untuk Edit di Tab AI*/}
{selectedPhoto && tab === "ai" && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded w-full max-w-md max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Detail Gambar</h2>
      <img
        src={`https://monja-file.pptik.id/v1/view?path=presensi/${selectedPhoto.gambar}`}
        alt="Preview"
        className="w-full h-64 object-cover rounded mb-4"
      />
      <p><strong>Nama:</strong> {selectedPhoto.nama}</p>
      <p><strong>Mood:</strong> {selectedPhoto.mood}</p>
      <p><strong>Keletihan:</strong> {selectedPhoto.keletihan}%</p>
      <p><strong>Status:</strong> {selectedPhoto.status_absen || "-"}</p>
      <p><strong>GUID:</strong> {selectedPhoto.guid}</p>
      <p><strong>GUID Device:</strong> {selectedPhoto.guid_device}</p>
      <p><strong>DateTime:</strong> {selectedPhoto.datetime}</p>
      <p><strong>Timestamp:</strong> {selectedPhoto.timestamp}</p>
      <p><strong>Unit:</strong></p>
      <input
        type="text"
        value={editUnit}
        onChange={(e) => setEditUnit(e.target.value)}
        className="border px-2 py-1 w-full mb-4"
      />
      <p><strong>Proses:</strong> {selectedPhoto.process || "-"}</p>
      <div className="flex justify-between gap-2">
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
        <button
          onClick={async () => {
            if (window.confirm("Yakin ingin menghapus data ini?")) {
              try {
                await deleteDataCameraHistory(selectedPhoto.id);
                setSelectedPhoto(null);
                getDataHistoriesAi();
              } catch (error) {
                alert("Gagal menghapus data.");
              }
            }
          }}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}


      {/* Modal Detail */}
      {selectedPhoto && tab === "dashboard" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Detail Gambar & Grafik</h2>
            <img
              src={`https://monja-file.pptik.id/v1/view?path=presensi/${selectedPhoto.gambar}`}
              alt="Preview"
              className="w-full h-64 object-cover rounded mb-4"
            />
            <p><strong>Nama:</strong> {selectedPhoto.nama}</p>
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
            <div className="flex justify-end gap-2 mb-4">
              <button onClick={() => setSelectedPhoto(null)} className="px-4 py-2 bg-gray-300 rounded">Batal</button>
              <button onClick={handleEdit} className="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button>
            </div>
            <h3 className="text-lg font-semibold mb-2">Grafik Keletihan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={grafikData}>
                <CartesianGrid stroke="#ccc" />
                <XAxis dataKey="tanggal" />
                <YAxis label={{ value: 'Keletihan (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="keletihan" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
            <h3 className="text-lg font-semibold mt-6 mb-2">Grafik Suasana Hati</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={grafikMood}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mood" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}


export default App;



<input
        type="month"
        onChange={(e) => setSearchTerm(e.target.value)} 
        className="px-4 py-2 border rounded w-1/3"
      />