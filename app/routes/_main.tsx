import { Outlet } from '@remix-run/react'
import Footer from '~/components/footer';
import NavBar from '~/components/navbar';

type Props = {
    children?: React.ReactNode;
}

export default function MainLayout({ children }: Props) {
    return (
        <>
            <NavBar  />

            <main>
                {children || <Outlet />}
            </main>

            <Footer />
        </>
    )
}