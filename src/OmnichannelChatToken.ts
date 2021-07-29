interface OmnichannelChatToken {
    chatId: string;
    expiresIn?: string;
    region?: string;
    regionGTMS?: Record<string, string>;
    token: string;
    visitorId?: string;
    voiceVideoCallToken?: string;
}

export default OmnichannelChatToken;