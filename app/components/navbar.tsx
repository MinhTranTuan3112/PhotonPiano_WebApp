import * as React from "react"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "./ui/navigation-menu"
import { Link, useNavigation, useSubmit } from "@remix-run/react"
import { cn } from "~/lib/utils"
import { Button, buttonVariants } from "./ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet"
import { Menu, Piano, X } from "lucide-react"
import { Separator } from "./ui/separator"
import pianoLogo from '../lib/assets/images/piano.png';
// import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog"
import pianoBackgroundImg from '../lib/assets/images/piano_background.jpg';

const components: { title: string; href: string; description: string }[] = [
    {
        title: "Blue Diamond (Beginner)",
        href: "/",
        description:
            "Dành cho người mới bắt đầu, không cần kiến thức nền tảng về piano.",
    },
    {
        title: "Diamond (Novice)",
        href: "/",
        description:
            "Dành cho người đã biết cách chơi piano cơ bản.",
    },
    {
        title: "Red Diamond (Intermediate)",
        href: "/",
        description:
            "Dành cho người đã biết cách chơi piano và muốn nâng cao kỹ năng.",
    },
    {
        title: "Black Diamond (Advanced)",
        href: "/",
        description:
            "Dành cho người đã biết cách chơi piano và muốn nâng cao kỹ năng.",
    },
    {
        title: "White Diamond (Virtuoso) ",
        href: "/",
        description:
            "Dành cho người đã biết cách chơi piano và muốn nâng cao kỹ năng.",
    }
]

const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Contact", href: "/contact" },
]


export default function NavBar() {

    // const authData = useRouteLoaderData<typeof loader>("root");

    const [isOpen, setIsOpen] = React.useState(false);

    const [isScrolling, setIsScrolling] = React.useState(false);

    React.useEffect(() => {

        const handleScroll = () => {
            if (window.scrollY > 5) {
                setIsScrolling(true);
            } else {
                setIsScrolling(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };

    }, []);

    const submit = useSubmit();

    const navigation = useNavigation();

    const isSubmitting = navigation.state === 'submitting';

    // const { open: handleOpenModal, dialog: confirmDialog } = useConfirmationDialog({
    //     title: 'Xác nhận đăng xuất?',
    //     description: 'Bạn có chắc chắn muốn đăng xuất?',
    //     onConfirm: () => {
    //         submit(null, {
    //             method: 'POST',
    //             action: '/sign-out'
    //         });
    //     },
    //     confirmText: 'Đăng xuất',
    // });


    return (
        <div className={`p-6 flex items-center sticky top-0 w-full bg-white transition-shadow duration-300 ${isScrolling ? 'shadow-md' : ''} z-50`}>
            <div className="w-full h-full flex md:gap-10 max-md:justify-between flex-row items-center">
                <div className="">
                    <Link to={'/'} className="font-bold text-2xl flex flex-row gap-1 items-center">
                        <Piano /> Photon Piano
                    </Link>
                </div>
                <NavigationMenu className="hidden md:block">
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="uppercase font-bold">Giới thiệu</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                    <li className="row-span-3" style={{
                                        backgroundImage: `url(${pianoBackgroundImg})`,
                                        backgroundSize: 'cover',
                                    }}>
                                        <NavigationMenuLink asChild>
                                            <Link
                                                to="/"
                                                className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                                            >
                                                <div className="mb-2 mt-4 text-lg font-medium">
                                                    Photon Piano
                                                </div>
                                                <p className="text-sm leading-tight text-muted-foreground">
                                                    Học piano trực tuyến với các giáo viên chuyên nghiệp và nhiều năm kinh nghiệm.
                                                </p>
                                            </Link>
                                        </NavigationMenuLink>
                                    </li>
                                    <ListItem href="/about" title="Về chúng tôi">
                                        Tìm hiểu về lịch sử hình thành và phát triển của trung tâm
                                    </ListItem>
                                    <ListItem href="/instructors" title="Đội ngũ giảng viên">
                                        Gặp gỡ các giảng viên giàu kinh nghiệm của chúng tôi.
                                    </ListItem>
                                    <ListItem href="/facilities" title="Cơ sở vật chất">
                                        Khám phá các cơ sở đào tạo và cơ sở vật chất hiện đại của chúng tôi.
                                    </ListItem>
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className={`uppercase font-bold ${buttonVariants({
                                variant: 'theme'
                            })}`}>Loại hình đào tạo</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                    {components.map((component) => (
                                        <ListItem
                                            key={component.title}
                                            title={component.title}
                                            href={component.href}
                                        >
                                            {component.description}
                                        </ListItem>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <Link to="/" className={`${navigationMenuTriggerStyle()} uppercase font-bold`}>
                                Thi xếp lớp đầu vào
                            </Link>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <Link to="/news" className={`${navigationMenuTriggerStyle()} uppercase font-bold ${buttonVariants({
                                variant: 'theme'
                            })}`}>
                                Tin tức
                            </Link>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <Link to="/" className={`${navigationMenuTriggerStyle()} uppercase font-bold`}>
                                Tài liệu
                            </Link>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>

                <section className="md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" className="px-2">
                                <span className="sr-only">Mở menu</span>
                                {isOpen ? (
                                    <X className="h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Menu className="h-6 w-6" aria-hidden="true" />
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                            <SheetTitle className="mb-3">Menu</SheetTitle>
                            <nav className="flex flex-col gap-4">
                                {navItems.map((item, index) => (
                                    <React.Fragment key={item.name}>
                                        <Link
                                            to={item.href}
                                            className="block px-3 py-2 text-base font-medium"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {item.name}
                                        </Link>
                                        {index < navItems.length - 1 && <Separator />}
                                    </React.Fragment>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </section>
            </div>
            <div className="hidden md:block">
                <Link className={`${buttonVariants({ variant: "theme" })} uppercase`}
                    to={'/sign-in'}>Đăng nhập</Link>
                {/* {(!authData || !authData.role) ? (
                    <Link className={`${buttonVariants({ variant: "theme" })} uppercase`}
                        to={'/sign-in'}>Đăng nhập</Link>
                ) : (
                    <>
                        <Button className="uppercase" variant={'theme'} onClick={handleOpenModal}
                            isLoading={isSubmitting}
                            disabled={isSubmitting}>
                            {isSubmitting ? 'Đang đăng xuất' : 'Đăng xuất'}
                        </Button>
                        {confirmDialog}
                    </>
                )} */}
            </div>
        </div>
    )
}

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    to={props.href || '/'}
                    ref={ref}
                    className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                    {...props}
                >
                    <div className="text-sm font-bold leading-none">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {children}
                    </p>
                </Link>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"