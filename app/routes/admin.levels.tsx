import { DraggableLevels } from "~/components/level/draggable-levels"
import { sampleLevels } from "~/lib/types/account/account"

type Props = {}

export default function LevelsManagementPage({ }: Props) {
    return (
        <article className="px-10">
            <h1 className="text-xl font-extrabold">Quản lý level piano đào tạo</h1>
            <p className='text-muted-foreground'>Danh sách các mức level trình độ piano được đào tạo ở trung tâm</p>

            <div className="my-3 md:max-w-[30%]">
                <DraggableLevels inititalLevels={sampleLevels} />
            </div>
        </article>
    )
}