import axios from "axios"
import { getBaseApiUrl } from "../constants/Urls"
import { formatErrorMessage } from "../constants/Utils"

let isRefreshing = false
let failedQueue = []

const AUTH_STORE_KEY = "authStore"

const processQueue = (error, token) => {
    failedQueue.forEach((p) => {
        if (token) {
            p.resolve(token)
        } else {
            p.reject(error)
        }
    })
    failedQueue = []
}

const clearPersistedAuthStore = () => {
    try {
        const raw = localStorage.getItem(AUTH_STORE_KEY)
        if (!raw) {
            return
        }

        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== "object") {
            return
        }

        const previousState = parsed.state || {}
        parsed.state = {
            ...previousState,
            user: null,
            token: null,
            isAuthenticated: false
        }

        localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(parsed))
    } catch {
        // Ignore invalid persisted auth state shape.
    }
}

const clearAuthSession = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    sessionStorage.removeItem("ACCESS_TOKEN")
    delete axios.defaults.headers.common["Authorization"]
    clearPersistedAuthStore()
}

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (
            error.response?.status !== 401 ||
            originalRequest?._retry ||
            originalRequest?.url?.includes("/auth/refresh") ||
            originalRequest?.url?.includes("/auth/login")
        ) {
            return Promise.reject(error)
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({
                    resolve: (token) => {
                        originalRequest.headers["Authorization"] = `Bearer ${token}`
                        resolve(axios(originalRequest))
                    },
                    reject,
                })
            })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
            const refreshToken = localStorage.getItem("refresh_token")
            if (!refreshToken) {
                throw new Error("No refresh token")
            }

            const { data } = await axios.post(
                `${getBaseApiUrl()}auth/refresh`,
                {},
                { headers: { Authorization: `Bearer ${refreshToken}` } }
            )

            const newToken = data.access_token
            localStorage.setItem("token", newToken)
            axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`
            processQueue(null, newToken)

            originalRequest.headers["Authorization"] = `Bearer ${newToken}`
            return axios(originalRequest)
        } catch (refreshError) {
            processQueue(refreshError, null)
            clearAuthSession()
            window.location.href = "/login"
            return Promise.reject(refreshError)
        } finally {
            isRefreshing = false
        }
    }
)

export const sendPost = async (url, body, baseUrl) => {
    var fullUrl
    if (url.includes("placeholder")) {
        fullUrl = "/placeholder-data/" + url.split("/")[1]
    } else {
        fullUrl = (baseUrl === undefined ? getBaseApiUrl() : baseUrl) + url
    }
    try {
        setHeader()
        var response = await axios.post(fullUrl, body)
        return handleResponse(response)
    } catch (error) {
        return handleResponse(error.response)
    }
}

export const sendGet = async (url, baseUrl) => {
    var fullUrl
    if (url.includes("placeholder")) {
        fullUrl = "/placeholder-data/" + url.split("/")[1]
    } else {
        fullUrl = (baseUrl === undefined ? getBaseApiUrl() : baseUrl) + url
    }
    try {
        setHeader()
        var response = await axios.get(fullUrl)
        return handleResponse(response)
    } catch (error) {
        return handleResponse(error.response)
    }
}

export const sendGetFile = async (url, baseUrl) => {
    var fullUrl = (baseUrl === undefined ? getBaseApiUrl() : baseUrl) + url
    try {
        setHeader()
        var response = await axios.get(fullUrl, { responseType: "blob" })
        return response
    } catch (error) {
        return handleResponse(error.response)
    }
}

export const uploadFile = async (url, file, baseUrl) => {
    var fullUrl = (baseUrl === undefined ? getBaseApiUrl() : baseUrl) + url
    try {
        var formData = new FormData()
        formData.append("file", file)
        var response = await axios.post(fullUrl, formData)
        return handleResponse(response)
    } catch (error) {
        return handleResponse(error.response)
    }
}

export const uploadFiles = async (url, files, baseUrl) => {
    var fullUrl = (baseUrl === undefined ? getBaseApiUrl() : baseUrl) + url
    try {
        var formData = new FormData()
        files.forEach((file) => {
            formData.append("files", file, file.name)
        })
        var response = await axios.post(fullUrl, formData)
        return handleResponse(response)
    } catch (error) {
        return handleResponse(error.response)
    }
}

export const sendPut = async (url, body, baseUrl) => {
    var fullUrl = (baseUrl === undefined ? getBaseApiUrl() : baseUrl) + url
    try {
        setHeader()
        var response = await axios.put(fullUrl, body)
        return handleResponse(response)
    } catch (error) {
        return handleResponse(error.response)
    }
}

export const sendPatch = async (url, body, baseUrl) => {
    var fullUrl = (baseUrl === undefined ? getBaseApiUrl() : baseUrl) + url
    try {
        setHeader()
        var response = await axios.patch(fullUrl, body)
        return handleResponse(response)
    } catch (error) {
        return handleResponse(error.response)
    }
}

export const sendDelete = async (url, body, baseUrl) => {
    var fullUrl = (baseUrl === undefined ? getBaseApiUrl() : baseUrl) + url
    try {
        setHeader()
        var response = await axios.delete(fullUrl, { data: body })
        return handleResponse(response)
    } catch (error) {
        return handleResponse(error.response)
    }
}

const setHeader = () => {
    const accessToken =
        localStorage.getItem("token") || sessionStorage.getItem("ACCESS_TOKEN")

    axios.defaults.withCredentials = true
    axios.defaults.headers.common["Access-Control-Allow-Origin"] = "*"

    if (accessToken) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`
    } else {
        delete axios.defaults.headers.common["Authorization"]
    }
}

const handleResponse = (response) => {
    if (!response) {
        return {
            status: "Error",
            errorMessage: "Network error or no response from server"
        }
    }

    if (response.status === 200 || response.status === 204 || response.status === 201) {
        if (response.data === undefined) {
            return response
        }

        return response.data
    }

    if (response.status === 401) {
        clearAuthSession()
    }

    const errorMessage = formatErrorMessage(
        response.data?.errors ||
            response.data?.message ||
            response.data?.msg ||
            response.data ||
            "An unknown error occurred"
    )

    return {
        status: "Error",
        errorMessage: errorMessage
    }
}
