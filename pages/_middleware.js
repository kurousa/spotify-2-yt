import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
    // Token will exist if user is logged in.
    const token = await getToken({ req, secret: process.env.JWT_SECRET });
  
    const { pathname } = req.nextUrl
   
    // Allow the requests if the following is true...
    // 1) Its a request for NEXT-AUTH session & provider fetching
    // 2) the token exists
    if (pathname.includes('/api/auth') || token) {
        // Pass to next path
        return NextResponse.next();
    }

    // Redirect them to login if they dont have token AND are requesting a protected route
    if(!token && pathname !== "/login") {
        // Pass to login page.
        console.log('NOT AUTHENTICATED. Please login.')
        return NextResponse.redirect("/login");
    }
}