import axios from "axios";

const api = axios.create({
   baseURL: "https://api-human-detection.pptik.id/ai/data",
})

const apiLocal = axios.create({
   baseURL: "http://localhost:4000",
})

// GET semua data dari semua halaman (misal 5 halaman)
export const getDataAI = async () => {
    const response = await api.get("/ai/data");
    return response.data;
}

export const getAllCameraHistory = async (totalPages = 5) => {
    let allData = [];

    for (let page = 1; page <= totalPages; page++) {
    const response = await api.get("/history_ai/get/page1", { params: { page } });
    if (response.data && response.data.data) {
        allData = allData.contat(response.data.data);
    }
}

    return allData;
}

export const getAllCameraHistories = async (totalPages = 5) => {
    const response = await apiLocal.get("/history_ai/get", { params: { page: totalPages } });
    return response.data.data
}

//GET data perhalaman ( jika ingin tetap memakai pagination manual)
export const getDataCameraHistory= async (page) => {
    const response = await api.get("/history_ai/get/683e66a72b06bb1a084fe281", {params: { page }, });
    return response.data;
    }

// DELETE data by ID
export const deleteDataCameraHistory = async (id) => {
    const response = await api.delete(`/history_ai/delete/683e642979fbccf67dbb4b3d${id}`);
    return response.data;
};

//UPDATE data by ID
export const updateDataCameraHistory = async (id, data) => {
    const response = await api.put(`/history_update/update/683e66a72b06bb1a084fe281${id}`,data);
    return response.data;
};

// CREATE data by ID dan Password
export const postDataCameraHistory = async (id, data) => {
    const response = await api.post(`/history/create/${id}`,data);
    return response.data;
};

//OPSIONAL endpoint (tambahan untuk foto)
export const fetchPhotos = async () => {
    const response = await api.get("/api/photos");
    return response.data;
};