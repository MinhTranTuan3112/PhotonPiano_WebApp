import { LoaderFunctionArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react'
import Footer from '~/components/footer';
import NavBar from '~/components/navbar';
import { fetchLevels } from '~/lib/services/level';
import { Level } from '~/lib/types/account/account';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';

type Props = {
    children?: React.ReactNode;
}


export async function loader({ request }: LoaderFunctionArgs) {
    try {

        const fetchLevelsPromise = fetchLevels().then((response) => {

            const levelsPromise: Promise<Level[]> = response.data;

            return {
                levelsPromise
            }
        });

        return {
            fetchLevelsPromise
        }

    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }
}

export default function MainLayout({ children }: Props) {

    const { fetchLevelsPromise } = useLoaderData<typeof loader>();

    return (
        <>
            <NavBar fetchLevelsPromise={fetchLevelsPromise}/>

            <main>
                {children || <Outlet />}
            </main>

            <Footer />
        </>
    )
}