export const Api = {
    apiRoot: 'api',
    service: {
        userAccount: "/user",
        auth: "/auth",
        admin: "/admin",
    },
    method :{
        register: '/register',
        login: '/login',
        logout: '/logout',
        refreshToken: "/refresh",
        confirmEmail: "/confirm",
    },
} as const

export type Api = typeof Api[keyof typeof Api]