declare module 'next/navigation' {
    export function usePathname(): string;
    export function useRouter(): any;
    export function useSearchParams(): any;
}

declare module 'next/dynamic' {
    const dynamic: any;
    export default dynamic;
}

declare module 'next/server' {
    export class NextResponse {
        static json(body: any, init?: any): any;
        static redirect(url: string | URL, init?: number | ResponseInit): any;
        static rewrite(url: string | URL, init?: ResponseInit): any;
        static next(init?: ResponseInit): any;
    }
    export class NextRequest extends Request {
        cookies: any;
        nextUrl: URL;
        ip?: string;
        geo?: any;
    }
}

declare module 'next/image' {
    import React from 'react';
    export default function Image(props: any): React.ReactNode;
}
