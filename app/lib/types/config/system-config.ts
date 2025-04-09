import { Role } from "../account/account"

export type SystemConfig = {
    id : string,
    configName : string,
    configValue : string,
    role : Role
}