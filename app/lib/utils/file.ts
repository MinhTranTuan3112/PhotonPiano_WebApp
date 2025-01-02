
export const formatFileSize = (bytes: number) => {
    if (bytes === 0) { return '0 KB' }

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(0))} ${sizes[i]}`
}