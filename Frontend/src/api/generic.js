import axios from "axios"
import { getBaseApiUrl } from "../constants/Urls"
import { formatErrorMessage } from "../constants/Utils"

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
        files.forEach((file, index) => {
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

const AUTH_STORE_KEY = "authStore"

const getStoredAccessToken = () => localStorage.getItem("token") || sessionStorage.getItem("ACCESS_TOKEN")

const decodeJwtPayload = (token) => {
    if (!token || typeof token !== "string") {
        return null
    }

    try {
        const payloadPart = token.split(".")[1]
        if (!payloadPart) {
            return null
        }

        const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/")
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
        return JSON.parse(atob(padded))
    } catch {
        return null
    }
}

const isJwtExpired = (token) => {
    const payload = decodeJwtPayload(token)
    if (!payload || !payload.exp) {
        return false
    }
    return Date.now() >= Number(payload.exp) * 1000
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
    localStorage.removeItem("user")
    sessionStorage.removeItem("ACCESS_TOKEN")
    delete axios.defaults.headers.common["Authorization"]
    clearPersistedAuthStore()
}

const setHeader = () => {
    const accessToken = getStoredAccessToken()

    axios.defaults.withCredentials = true
    axios.defaults.headers.common["Access-Control-Allow-Origin"] = "*"

    if (!accessToken || isJwtExpired(accessToken)) {
        clearAuthSession()
        return
    }

    axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`
}

const handleResponse = (response) => {
    // Handle cases where response is undefined (network error, no response from server)
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
    } else {
        if (response.status === 401) {
            clearAuthSession()
        }

        const errorMessage = formatErrorMessage(
            response.data?.errors || response.data?.message || response.data?.msg || response.data || "An unknown error occurred"
        )
        // alert(errorMessage)
        return {
            status: "Error",
            errorMessage: errorMessage
        }
    }
}
