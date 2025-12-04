'use server';
import { cookies} from 'next/headers';

const CHAT_ID_COOKIE_NAME = "chat_id"
const CHAT_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

export async function setChatIdCookie(chatId: string) {
    const cookieStore = await cookies()
    cookieStore.set(CHAT_ID_COOKIE_NAME, chatId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: CHAT_ID_COOKIE_MAX_AGE,
    })
    return chatId;
}
