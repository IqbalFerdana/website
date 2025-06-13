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
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

// Dummy AI data (if needed)
const dummyAiData = [];

function App() {
  const [data, setData] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
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
  const [dataHistoriesAi, setDataHistoriesAi] = useState([]);
  const [searchGrafik, setSearchGrafik] = useState("");
  const [userData, setUserData] = useState([]);
  const [grafikFilter, setGrafikFilter] = useState([]);
  const [detailFilter, setDetailFilter] = useState({
    nama: '',
    guid_device: '',
    tanggal_hari: '',
    bulan_tahun: ''
  });
  const [profilingData, setProfilingData] = useState([]);

  const combinedDashboardData = [
    ...data,
    ...dataHistoriesAi.filter(itemAi => !data.some(item => item.id === itemAi.id))
  ];

  // Prepare profiling chart data
  const prepareProfilingChartData = () => {
    return profilingData.map(item => ({
      date: item.date,
      keletihan: parseFloat(item.keletihan) || 0,
      bahagia: parseFloat(item.bahagia) || 0,
      sedih: parseFloat(item.sedih) || 0,
      marah: parseFloat(item.marah) || 0,
      netral: parseFloat(item.netral) || 0
    }));
  };

  // Prepare mood distribution data for pie chart
  const prepareMoodDistributionData = () => {
    if (profilingData.length === 0) return [];

    // Calculate average mood percentages
    const totalDays = profilingData.length;
    const averageMoods = profilingData.reduce((acc, curr) => {
      acc.bahagia += parseFloat(curr.bahagia) || 0;
      acc.sedih += parseFloat(curr.sedih) || 0;
      acc.marah += parseFloat(curr.marah) || 0;
      acc.netral += parseFloat(curr.netral) || 0;
      return acc;
    }, { bahagia: 0, sedih: 0, marah: 0, netral: 0 });

    return [
      { name: 'Bahagia', value: averageMoods.bahagia / totalDays, fill: '#22c55e' },
      { name: 'Sedih', value: averageMoods.sedih / totalDays, fill: '#facc15' },
      { name: 'Marah', value: averageMoods.marah / totalDays, fill: '#ef4444' },
      { name: 'Netral', value: averageMoods.netral / totalDays, fill: '#3b82f6' }
    ];
  };

  const prepareUserChartData = (userGuid) => {
    // Filter data berdasarkan user yang dipilih dan 1 bulan terakhir
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const filteredData = dataHistoriesAi.filter(item => {
      return item.guid_device === userGuid && 
             new Date(item.datetime) >= oneMonthAgo;
    });

    // Siapkan data keletihan per hari
    const fatigueData = filteredData.reduce((acc, curr) => {
      const date = curr.datetime?.slice(0, 10);
      if (!acc[date]) {
        acc[date] = {
          date,
          totalFatigue: 0,
          count: 0
        };
      }
      acc[date].totalFatigue += parseFloat(curr.keletihan) || 0;
      acc[date].count += 1;
      return acc;
    }, {});

    const fatigueChartData = Object.values(fatigueData).map(item => ({
      date: item.date,
      keletihan: item.count > 0 ? (item.totalFatigue / item.count).toFixed(1) : 0
    }));

    // Siapkan data mood per hari
    const moodData = filteredData.reduce((acc, curr) => {
      const date = curr.datetime?.slice(0, 10);
      const mood = (curr.mood || "Tidak Terdeteksi").toLowerCase();
      
      if (!acc[date]) {
        acc[date] = {
          date,
          moods: {
            bahagia: 0,
            sedih: 0,
            marah: 0,
            netral: 0,
            lainnya: 0
          }
        };
      }
      
      if (mood.includes("senang") || mood.includes("bahagia")) {
        acc[date].moods.bahagia += 1;
      } else if (mood.includes("sedih")) {
        acc[date].moods.sedih += 1;
      } else if (mood.includes("marah")) {
        acc[date].moods.marah += 1;
      } else if (mood.includes("netral")) {
        acc[date].moods.netral += 1;
      } else {
        acc[date].moods.lainnya += 1;
      }
      
      return acc;
    }, {});

    const moodChartData = Object.values(moodData).map(item => ({
      date: item.date,
      ...item.moods
    }));

    return { fatigueChartData, moodChartData };
  };

  const getFilteredDetailData = () => {
    return dataHistoriesAi.filter(item => {
      const isSelectedUser = item.guid_device === selectedPhoto?.guid_device;
      const namaMatch = !detailFilter.nama || 
        (item.nama && item.nama.toLowerCase().includes(detailFilter.nama.toLowerCase()));
      const guidMatch = !detailFilter.guid_device || 
        item.guid_device?.includes(detailFilter.guid_device);
      
      // Ekstrak bagian tanggal dari datetime (format DD-MM-YYYY)
      const [day, month, year] = item.datetime?.split('-') || [];
      
      // Filter berdasarkan hari (DD)
      const hariMatch = !detailFilter.tanggal_hari || day === detailFilter.tanggal_hari;
      
      // Filter berdasarkan bulan & tahun (YYYY-MM)
      const bulanTahunMatch = !detailFilter.bulan_tahun || 
        `${year}-${month}` === detailFilter.bulan_tahun;
      
      return isSelectedUser && namaMatch && guidMatch && hariMatch && bulanTahunMatch;
    });
  };

  const handleGrafikFilterChange = (e) => {
    const { name, value } = e.target;
    setGrafikFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetGrafikFilter = () => {
    setGrafikFilter({
      nama: '',
      guid_device: '',
      tanggal: '',
      bulan: ''
    });
  };

  const getFilteredGrafikData = () => {
    return dataHistoriesAi.filter(item => {
      // Filter utama berdasarkan karyawan yang dipilih
      const isSelectedUser = item.guid_device === selectedPhoto?.guid_device;
      
      // Filter berdasarkan input pengguna
      const namaMatch = !grafikFilter.nama || 
        (item.nama && item.nama.toLowerCase().includes(grafikFilter.nama.toLowerCase()));
      
      const tanggalMatch = !grafikFilter.tanggal || 
        (item.datetime && item.datetime.slice(0, 10) === grafikFilter.tanggal);
      
      const bulanMatch = !grafikFilter.bulan || 
        (item.datetime && item.datetime.slice(0, 7) === grafikFilter.bulan);
      
      return isSelectedUser && namaMatch && (tanggalMatch || bulanMatch);
    });
  };

  const prepareGrafikData = () => {
    const filteredData = getFilteredGrafikData();
    
    // Data untuk grafik keletihan
    const keletihanData = filteredData.map(item => ({
      tanggal: item.datetime?.slice(0, 10),
      keletihan: item.keletihan
    }));

    // Data untuk grafik mood
    const moodData = Object.entries(
      filteredData.reduce((acc, curr) => {
        let mood = (curr.mood || "").toLowerCase();
        if (mood === "senang") mood = "bahagia";
        mood = mood.charAt(0).toUpperCase() + mood.slice(1);
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      }, {})
    ).map(([mood, count]) => ({ mood, count }));

    return { keletihanData, moodData };
  };

  const { keletihanData, moodData } = prepareGrafikData();

  const fetchUserData = async () => {
    try {
      const response = await fetch("https://presensi-api.lskk.co.id/api/v1/user/public?id-institution=CMb80a&isDeleted=false");
      const data = await response.json();
      console.log("Data user dari API:", data); // Untuk debugging
      
      const usersWithPhoto = data.data.map(user => ({
        ...user,
        photo: user.photo 
          ? user.photo.startsWith('http') 
            ? user.photo 
            : `https://presensi-api.lskk.co.id${user.photo}`
          : null
      }));
      
      setUserData(usersWithPhoto || []);
    } catch (error) {
      console.error("Gagal mengambil data user:", error);
    }
  };

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

  // Load profiling data
  useEffect(() => {
    // In a real app, you would fetch this from an API
    // For now, we'll use the imported dummy data
    const loadProfilingData = async () => {
      try {
        // This would be replaced with an actual API call in production
        // const response = await fetch('/api/profiling');
        // const data = await response.json();
        setProfilingData([
          {
            "_id": "profiling-01",
            "date": "01-05-2025",
            "guid": "profiling-01",
            "userGuid": "profiling",
            "name": "Profiling",
            "keletihan": "15",
            "bahagia": "20",
            "sedih": "5",
            "marah": "10",
            "netral": "50",
            "createdAt": "2025-05-01T00:00:00.000Z",
            "updatedAt": "2025-05-01T00:00:00.000Z"
          },
          {
            "_id": "profiling-02",
            "date": "02-05-2025",
            "guid": "profiling-02",
            "userGuid": "profiling",
            "name": "Profiling",
            "keletihan": "12",
            "bahagia": "25",
            "sedih": "4",
            "marah": "9",
            "netral": "50",
            "createdAt": "2025-05-02T00:00:00.000Z",
            "updatedAt": "2025-05-02T00:00:00.000Z"
          },
          {
            "_id": "profiling-03",
            "date": "03-05-2025",
            "guid": "profiling-03",
            "userGuid": "profiling",
            "name": "Profiling",
            "keletihan": "18",
            "bahagia": "15",
            "sedih": "10",
            "marah": "7",
            "netral": "50",
            "createdAt": "2025-05-03T00:00:00.000Z",
            "updatedAt": "2025-05-03T00:00:00.000Z"
          },
          {
            "_id": "profiling-04",
            "date": "04-05-2025",
            "guid": "profiling-04",
            "userGuid": "profiling",
            "name": "Profiling",
            "keletihan": "10",
            "bahagia": "30",
            "sedih": "2",
            "marah": "8",
            "netral": "50",
            "createdAt": "2025-05-04T00:00:00.000Z",
            "updatedAt": "2025-05-04T00:00:00.000Z"
          },
          {
            "_id": "profiling-05",
            "date": "05-05-2025",
            "guid": "profiling-05",
            "userGuid": "profiling",
            "name": "Profiling",
            "keletihan": "20",
            "bahagia": "10",
            "sedih": "8",
            "marah": "12",
            "netral": "50",
            "createdAt": "2025-05-05T00:00:00.000Z",
            "updatedAt": "2025-05-05T00:00:00.000Z"
          },
          {
            "_id": "profiling-06",
            "date": "06-05-2025",
            "guid": "profiling-06",
            "userGuid": "profiling",
            "name": "Profiling",
            "keletihan": "14",
            "bahagia": "18",
            "sedih": "6",
            "marah": "12",
            "netral": "50",
            "createdAt": "2025-05-06T00:00:00.000Z",
            "updatedAt": "2025-05-06T00:00:00.000Z"
          },
          {
            "_id": "profiling-07",
            "date": "07-05-2025",
            "guid": "profiling-07",
            "userGuid": "profiling",
            "name": "Profiling",
            "keletihan": "13",
            "bahagia": "21",
            "sedih": "7",
            "marah": "9",
            "netral": "50",
            "createdAt": "2025-05-07T00:00:00.000Z",
            "updatedAt": "2025-05-07T00:00:00.000Z"
          }
        ]);
      } catch (error) {
        console.error("Failed to load profiling data:", error);
      }
    };

    loadProfilingData();
  }, []);

  useEffect(() => {
    if (tab === "dashboardUser") {
      fetchUserData();
    }
  }, [tab]);

  useEffect(() => {
    getDataHistoriesAi()
  }, [])

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
    if (tab === "kamera") {
      fetchData();
    }
  }, [page, tab]);

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

  const filteredData = (tab === "dashboard" ? combinedDashboardData : data).filter((item) =>
    item.guid_device?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.nama || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dashboardData = filteredData.slice(
    (dashboardPage - 1) * itemsPerPage,
    dashboardPage * itemsPerPage
  );

  const grafikData = dataHistoriesAi
    .filter(item =>
      item.guid_device === selectedPhoto?.guid_device && // Filter berdasarkan guid_device yang dipilih
      (
        item.nama?.toLowerCase().includes(searchGrafik.toLowerCase()) ||
        item.datetime?.slice(0, 10).includes(searchGrafik) ||
        item.datetime?.slice(0, 7).includes(searchGrafik)
      )
    )
    .map(item => ({
      tanggal: item.datetime?.slice(0, 10),
      keletihan: item.keletihan,
      mood: item.mood
    }));

  const grafikMood = Object.entries(
    dataHistoriesAi
      .filter(item =>
        item.guid_device === selectedPhoto?.guid_device && // Filter berdasarkan guid_device yang dipilih
        (
          item.nama?.toLowerCase().includes(searchGrafik.toLowerCase()) ||
          item.datetime?.slice(0, 10).includes(searchGrafik) ||
          item.datetime?.slice(0, 7).includes(searchGrafik)
        )
      .reduce((acc, curr) => {
        let mood = (curr.mood || "").toLowerCase();
        if (mood === "senang") mood = "bahagia";
        mood = mood.charAt(0).toUpperCase() + mood.slice(1);
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      }, {})
  ).map(([mood, count]) => ({ mood, count })));

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
        <button className={`px-4 py-2 rounded ${tab === "dashboardUser" ? "bg-blue-600 text-white" : "bg-gray-300"}`} onClick={() => setTab("dashboardUser")}>Dashboard User</button>
      </div>

      {/* Tab Kamera */}
      {tab === "kamera" && (
        <>
          <div className="flex items-center justify-between mb-4 gap-2">
            <input
              type="text"
              placeholder="Cari berdasarkan guid_device..."
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
          <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
          <div className="flex items-center justify-between mb-4">
            <input 
              type="text" 
              placeholder="Cari berdasarkan nama atau guid_device..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="px-4 py-2 border rounded w-full mr-4" 
            />
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
                        <button 
                          onClick={() => {
                            setSelectedPhoto(item);
                            setEditUnit(item.unit || "User");
                          }} 
                          className="text-xs text-blue-600 underline"
                        >
                          Detail
                        </button>
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
              <button 
                onClick={() => setDashboardPage((prev) => Math.max(prev - 1, 1))} 
                disabled={dashboardPage === 1} 
                className="px-3 py-1 rounded border bg-white"
              >
                Sebelumnya
              </button>
              {[1, 2, 3, 4, 5].map((p) => (
                <button 
                  key={p} 
                  onClick={() => setDashboardPage(p)} 
                  className={`px-3 py-1 rounded border ${dashboardPage === p ? "bg-blue-600 text-white" : "bg-white"}`}
                >
                  {p}
                </button>
              ))}
              <button 
                onClick={() => setDashboardPage((prev) => Math.min(prev + 1, maxDashboardPages))} 
                disabled={dashboardPage === maxDashboardPages} 
                className="px-3 py-1 rounded border bg-white"
              >
                Berikutnya
              </button>
            </div>
            <p className="text-sm text-gray-500">Halaman {dashboardPage} dari {maxDashboardPages}</p>
          </div>
        </>
      )}

      {/* Tab Dashboard User */}
      {tab === "dashboardUser" && (
        <>
          <h2 className="text-2xl font-bold mb-4">Dashboard User</h2>
          <div className="flex items-center justify-between mb-4">
            <input 
              type="text" 
              placeholder="Cari berdasarkan nama dan unit..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="px-4 py-2 border rounded w-full mr-4" 
            />
            <button 
              onClick={fetchUserData} 
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              Refresh Data
            </button>
          </div>

          {userData.length === 0 ? (
            <p className="text-gray-500">Tidak ada data user tersedia.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-2 border">No</th>
                    <th className="p-2 border">Foto</th>
                    <th className="p-2 border">Nama</th>
                    <th className="p-2 border">Unit</th>
                    <th className="p-2 border">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {userData
                    .filter(user => 
                      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.detail?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((user, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="p-2 border">{index+1}</td>
                        <td className="p-2 border">
                          {user.photo ? (
                            <img 
                              src={user.photo} 
                              alt={user.name} 
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = 'https://via.placeholder.com/150';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs">No Photo</span>
                            </div>
                          )}
                        </td>
                        
                        <td className="p-2 border">{user.name}</td>
                        <td className="p-2 border">{user.unit}</td>
                        <td className="p-2 border">
                          <button 
                            onClick={() => setSelectedUser(user)}
                            className="text-xs text-blue-600 underline"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal Detail User */}
      {selectedUser && tab === "dashboardUser" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Detail User</h2>
            
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              {/* Info User */}
              <div className="flex flex-col items-center md:w-1/3">
                {selectedUser.photo ? (
                  <img 
                    src={selectedUser.photo} 
                    alt={selectedUser.name} 
                    className="w-32 h-32 rounded-full object-cover mb-4"
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = 'https://via.placeholder.com/150';
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                    <span>No Photo</span>
                  </div>
                )}
                <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500">{selectedUser.position || '-'}</p>
                
                <div className="mt-4 w-full">
                  <DetailItem label="Profesi" value={selectedUser.profession} />
                  <DetailItem label="Email" value={selectedUser.email} />
                  <DetailItem label="No. Telp" value={selectedUser.phoneNumber} />
                  <DetailItem label="Unit" value={selectedUser.unit} />
                  <DetailItem label="Status" value={selectedUser.isDeleted ? "Non-Aktif" : "Aktif"} />
                </div>
              </div>
              
              {/* Grafik */}
              <div className="md:w-2/3">
                <h3 className="text-xl font-semibold mb-4">Analisis Profil Emosi</h3>
                
                {/* Grafik Keletihan */}
                <div className="mb-8">
                  <h4 className="font-medium mb-2">Tingkat Keletihan</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={prepareProfilingChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => value.slice(0, 5)} // Hanya tampilkan tanggal
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, "Keletihan"]}
                          labelFormatter={(date) => `Tanggal: ${date}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="keletihan" 
                          stroke="#8884d8" 
                          name="Keletihan (%)"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Grafik Mood */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Distribusi Suasana Hati</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareMoodDistributionData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {prepareMoodDistributionData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value}%`, "Persentase"]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Detail Emosi</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareProfilingChartData()}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => value.slice(0, 5)} // Hanya tampilkan tanggal
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [`${value}%`, name]}
                            labelFormatter={(date) => `Tanggal: ${date}`}
                          />
                          <Legend />
                          <Bar dataKey="bahagia" stackId="a" fill="#22c55e" name="Bahagia" />
                          <Bar dataKey="netral" stackId="a" fill="#3b82f6" name="Netral" />
                          <Bar dataKey="sedih" stackId="a" fill="#facc15" name="Sedih" />
                          <Bar dataKey="marah" stackId="a" fill="#ef4444" name="Marah" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Data AI */}
      {tab === "ai" && (
        <>
          {/* Filter dan Refresh Data */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <input
              type="text"
              placeholder="Cari berdasarkan nama..."
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
                      bahagia: "bg-green-500",
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
                            Detail
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

      {selectedPhoto && tab === "kamera" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Detail Gambar</h2>
            <img
              src={`https://monja-file.pptik.id/v1/view?path=presensi/${selectedPhoto.gambar}`}
              alt="Preview"
              className="w-full h-64 object-cover rounded mb-4"
            />
            <p><strong>Nama:</strong> {selectedPhoto.nama || "-"}</p>
            <p><strong>GUID Device:</strong> {selectedPhoto.guid_device || "-"}</p>
            <p><strong>Datetime:</strong> {selectedPhoto.datetime || "-"}</p>
            <p><strong>Filter Nama/Tanggal/Bulan:</strong></p>
            <input
              type="text"
              value={searchGrafik}
              onChange={(e) => setSearchGrafik(e.target.value)}
              className="border px-2 py-1 w-full mb-4"
              placeholder="Contoh: ikbal / 2025-06 / 2025-06-10"
            />
            <div className="flex justify-between gap-2">
              <button onClick={() => setSelectedPhoto(null)} className="px-4 py-2 bg-gray-300 rounded">Batal</button>
              <button onClick={handleEdit} className="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button>
              <button
                onClick={async () => {
                  if (window.confirm("Yakin ingin menghapus data ini?")) {
                    try {
                      await deleteDataCameraHistory(selectedPhoto.id);
                      setSelectedPhoto(null);
                      fetchData();
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

      {/* Modal Detail Dashboard*/}
      {selectedPhoto && tab === "dashboard" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Detail Grafik - {selectedPhoto.nama || selectedPhoto.guid_device}</h2>

            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Filter Nama */}
              <div>
                <label className="block text-sm font-medium mb-1">Nama</label>
                <input
                  type="text"
                  name="nama"
                  value={detailFilter.nama}
                  onChange={(e) => setDetailFilter({...detailFilter, nama: e.target.value})}
                  placeholder="Filter nama..."
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              {/* Filter GUID Device */}
              <div>
                <label className="block text-sm font-medium mb-1">GUID Device</label>
                <input
                  type="text"
                  name="guid_device"
                  value={detailFilter.guid_device}
                  onChange={(e) => setDetailFilter({...detailFilter, guid_device: e.target.value})}
                  placeholder="Filter GUID..."
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              {/* Filter Tanggal (Hari) */}
              <div>
                <label className="block text-sm font-medium mb-1">Tanggal / Hari (DD)</label>
                <select
                  name="tanggal_hari"
                  value={detailFilter.tanggal_hari}
                  onChange={(e) => setDetailFilter({...detailFilter, tanggal_hari: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Semua Hari</option>
                  {Array.from({length: 31}, (_, i) => {
                    const day = (i + 1).toString().padStart(2, '0');
                    return <option key={day} value={day}>{day}</option>;
                  })}
                </select>
              </div>

              {/* Filter Bulan & Tahun */}
              <div>
                <label className="block text-sm font-medium mb-1">Bulan & Tahun</label>
                <input
                  type="month"
                  name="bulan_tahun"
                  value={detailFilter.bulan_tahun}
                  onChange={(e) => setDetailFilter({...detailFilter, bulan_tahun: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setDetailFilter({
                  nama: '',
                  guid_device: '',
                  tanggal: '',
                  bulan: ''
                })}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Reset Filter
              </button>
              <div className="text-sm text-gray-500">
                Menampilkan data 1 bulan terakhir
              </div>
            </div>

            {/* Tambahkan setelah section filter dan sebelum tabel */}
            <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
              {detailFilter.tanggal_hari && (
                <span className="inline-block mr-3">
                  Hari: <strong>{detailFilter.tanggal_hari}</strong>
                </span>
              )}
              {detailFilter.bulan_tahun && (
                <span className="inline-block mr-3">
                  Periode: <strong>{detailFilter.bulan_tahun}</strong>
                </span>
              )}
              {(!detailFilter.tanggal_hari && !detailFilter.bulan_tahun) && (
                <span>Menampilkan semua tanggal</span>
              )}
            </div>

            {/* Tabel Data */}
            <div className="overflow-x-auto">
              <table className="w-full table-auto border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-2 border">Tanggal</th>
                    <th className="p-2 border">Nama</th>
                    <th className="p-2 border">GUID Device</th>
                    <th className="p-2 border">Keletihan</th>
                    <th className="p-2 border">Suasana Hati</th>
                    <th className="p-2 border">Gambar</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredDetailData().length > 0 ? (
                    getFilteredDetailData().map((item, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="p-2 border">{item.datetime?.slice(0, 10)}</td>
                        <td className="p-2 border">{item.nama || '-'}</td>
                        <td className="p-2 border">{item.guid_device}</td>
                        <td className="p-2 border">{item.keletihan || '-'}%</td>
                        <td className="p-2 border">
                          <span className={`px-2 py-1 rounded text-xs text-white ${
                            item.mood === 'Bahagia' || item.mood === 'bahagia' ? 'bg-green-500' :
                            item.mood === 'Sedih' || item.mood === 'sedih' ? 'bg-yellow-500' :
                            item.mood === 'Marah' || item.mood === 'marah' ? 'bg-red-500' :
                            item.mood === 'Netral' || item.mood === 'netral' ? 'bg-blue-500' : 
                            'bg-gray-500'
                          }`}>
                            {item.mood || '-'}
                          </span>
                        </td>
                        <td className="p-2 border">
                          <img 
                            src={`https://monja-file.pptik.id/v1/view?path=presensi/${item.gambar}`} 
                            alt="Preview" 
                            className="w-16 h-16 object-cover cursor-pointer"
                            onClick={() => window.open(`https://monja-file.pptik.id/v1/view?path=presensi/${item.gambar}`, '_blank')}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-gray-500">
                        Tidak ada data yang sesuai dengan filter
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Informasi Karyawan */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Informasi Karyawan</h3>
              <div className="grid grid-cols-2 gap-2">
                <p><span className="font-medium">Nama:</span> {selectedPhoto.nama || "-"}</p>
                <p><span className="font-medium">GUID Device:</span> {selectedPhoto.guid_device}</p>
                <p><span className="font-medium">Unit:</span> {selectedPhoto.unit || "-"}</p>
                <p><span className="font-medium">Total Data:</span> {keletihanData.length}</p>
              </div>
            </div>

            {/* Grafik */}
            <h3 className="text-lg font-semibold mt-8 mb-4">Visualisasi Data</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grafik Keletihan */}
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium mb-2">Presentase Keletihan</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getFilteredDetailData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="datetime" tickFormatter={(value) => value.slice(0, 10)} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="keletihan" 
                        stroke="#8884d8" 
                        name="Keletihan (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Grafik Mood */}
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium mb-2">Suasana Hati / Mood</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(
                      getFilteredDetailData().reduce((acc, curr) => {
                        const mood = curr.mood || 'Tidak Terdeteksi';
                        acc[mood] = (acc[mood] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([mood, count]) => ({ mood, count }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mood" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" name="Jumlah">
                        {Object.entries(
                          getFilteredDetailData().reduce((acc, curr) => {
                            const mood = curr.mood ? curr.mood.charAt(0).toUpperCase() + curr.mood.slice(1).toLowerCase() : 'Tidak Terdeteksi';
                            acc[mood] = (acc[mood] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([mood, _], index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={
                              mood === 'Bahagia' ? '#22c55e' :
                              mood === 'Sedih' ? '#facc15' :
                              mood === 'Marah' ? '#ef4444' :
                              mood === 'Netral' ? '#3b82f6' : 
                              '#9ca3af'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Tombol Tutup */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tambahkan ini di bagian paling bawah file, sebelum export default App
const DetailItem = ({ label, value }) => (
  <div className="flex">
    <span className="font-medium w-1/3">{label}:</span>
    <span className="w-2/3">{value || '-'}</span>
  </div>
);

export default App;