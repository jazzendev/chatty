export interface IConfig {
    apikey: string;
    model: string;
}

export interface IChatMessage {
    role: string;
    context: string;
}