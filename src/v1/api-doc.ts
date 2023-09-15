import oai from "express-openapi";
import { OpenAPIV3 } from "openapi-types";

const apiDoc: OpenAPIV3.Document = {
    openapi: "3.0.0",
    info: {
        title: "Backend for Situation Puzzle AI. ",
        version: "1.0.0",
    },
    paths: {},
    components: {
        schemas: {
            "Puzzle": {
                description: "Client representation of a puzzle. ",
                type: "object",
                properties: {
                    "id": {
                        type: "number",
                    },
                    "lead": {
                        type: "string",
                    }
                },
                required: ["id", "lead"],
            }
        }
    },
    servers: [
        {
            url: "http://localhost:5000/v1",
        }
    ]
}

export default apiDoc; 