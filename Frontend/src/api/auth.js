import { sendGet, sendPost } from "./Generic"
import { getSimpleObject } from "./Object"

export const getTicketsObject = (object) => {
    return getSimpleObject(object)
}

export const login = (data) => {
    return sendPost(`auth/login`, data)
}

export const getMe = () => {
    return sendGet(`auth/me`)
}

export const register = (data) => {
    return sendPost(`auth/register`, data)
}
