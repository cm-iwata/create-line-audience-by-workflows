export type Config = {
    projectId: string
    location: string
    lineClientId: string
}

export const getConfig = (): Config => {
    return {
        projectId: '<Google CloudプロジェクトのID>',
        location: 'asia-northeast1',
        lineClientId: '<LINE公式アカウントのChannel ID>'    
    }
}