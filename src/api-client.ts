import { config } from "./config";
import { IChatMessage } from "./interface";
const { Configuration, OpenAIApi } = require("openai");

let apiKey = config.apikey;
let model = config.model;

const configuration = new Configuration({
    apiKey: apiKey
});
const openai = new OpenAIApi(configuration);

const sendMessage = async (messages: Array<IChatMessage>) => {
    try {
        //console.log(messages);
        const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.5
            }),
        });
        return response.json()
            .then((data) => {
                //console.log(data);
                return data.choices[0].message.content;
            }).catch(error => {
                return "data wrong";
            });
    } catch (e) {
        console.error(e)
        return "Something went wrong"
    }
}

// https://github.com/openai/openai-node/issues/18#issuecomment-1369996933
const streamMessage = async (messages: Array<IChatMessage>, callback: (param: string) => void) => {
    try {
        const res = await openai.createChatCompletion({
            model: model,
            messages: messages,
            //max_tokens: 100,
            temperature: 0.5,
            stream: true,
        }, { responseType: 'stream' });

        res.data.on('data', data => {
            const lines = data.toString().split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                const message = line.replace(/^data: /, '');
                if (message === '[DONE]') {
                    callback("[DONE]");
                    return;
                }
                try {
                    const parsed = JSON.parse(message);
                    callback(JSON.stringify(parsed.choices[0].delta));
                } catch (error) {
                    callback("[ERROR]")
                    console.error('Could not JSON parse stream message', message, error);
                }
            }
        });
    } catch (error) {
        if (error.response?.status) {
            console.error(error.response.status, error.message);
            error.response.data.on('data', data => {
                const message = data.toString();
                try {
                    const parsed = JSON.parse(message);
                    console.error('An error occurred during OpenAI request: ', parsed);
                } catch (error) {
                    console.error('An error occurred during OpenAI request: ', message);
                }
            });
        } else {
            console.error('An error occurred during OpenAI request', error);
        }
    }
}

export { sendMessage, streamMessage };