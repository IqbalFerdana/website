import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000",
});

// GET semua data dari semua halaman (misalnya 3 halaman)
export const getAllCameraHistory = async (totalPages = 3) => {
  let allData = [];

  for (let page = 1; page <= totalPages; page++) {
    const response = await api.get("/history/get", { params: { page } });
    if (response.data && response.data.data) {
      allData = allData.concat(response.data.data);
    }
  }

  return allData;
};

// GET data per halaman (jika kamu ingin tetap pakai pagination manual)
export const getDataCameraHistory = async (page) => {
  const response = await api.get("/history/get", {
    params: { page },
  });
  return response.data;
};

// DELETE data by ID
export const deleteDataCameraHistory = async (id) => {
  const response = await api.delete(`/history/delete/${id}`);
  return response.data;
};

// UPDATE data by ID
export const updateDataCameraHistory = async (id, data) => {
  const response = await api.put(`/history/update/${id}`, data);
  return response.data;
};

// (Optional) Endpoint tambahan untuk foto
export const fetchPhotos = async () => {
  const response = await api.get("/api/photos");
  return response.data;
};
