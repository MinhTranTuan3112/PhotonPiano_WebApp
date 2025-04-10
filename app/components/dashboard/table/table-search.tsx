import { Search } from "lucide-react"
import { Input } from "../../ui/input"

const TableSearch = () => {
    return (
        <div className="relative w-full md:w-auto">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input type="text" placeholder="Search..." className="pl-8 w-full md:w-[200px]" />
        </div>
    )
}

export default TableSearch
