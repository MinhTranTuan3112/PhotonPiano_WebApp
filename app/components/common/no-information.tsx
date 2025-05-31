import { Badge } from '../ui/badge'

type Props = {
    text?: string;
}

export default function NoInformation({ text = 'No information' }: Props) {
    return (
        <Badge variant={'outline'} className='text-muted-foreground italic'>{text}</Badge>
    )
}