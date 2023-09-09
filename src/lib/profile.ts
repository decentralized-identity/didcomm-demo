export interface Secret {
    id: string;
    type: string;
    privateKeyJwk: {
        crv: string;
        d: string;
        kty: string;
        x: string;
    };
}

export interface Profile {
    profileId: string;
    secrets: Secret[];
}
