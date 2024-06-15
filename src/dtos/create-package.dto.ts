export interface CreatePackageDto {
    title: string,
    price: number,
    discount: number,
    durationType: [string],
    status: boolean,
    properties: { title: string, description: string, icon: string }[]
    details: string,
    banner: [string]
    icon: string,
    isSeatable: boolean,
    type: string
}