import Image from "../ui/image";

const Navbar = () => {
    return (
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-6 justify-end w-full">
                <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer">
                    <Image src="app/lib/assets/images/message.png" alt="Messages" className="rounded-md object-cover w-5 h-5" />
                </div>
            </div>
        </div>
    );
}

export default Navbar