export const Api = {
    apiRoot: 'api',
    service: {
        userAccount: "/user",
        admin: "/admin"
    },
    method :{
        register: '/register',
        login: '/login',
        logout: '/logout'
    },
} as const

export type Api = typeof Api[keyof typeof Api]