import multer from "multer";
import type { NextFunction, Request, Response } from "express";

// Memory storage — CSV imports are small and consumed once as a Buffer,
// never need to touch disk.
const storage = multer.memoryStorage();

const uploadCsv = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const isCsv =
            file.mimetype === "text/csv" ||
            file.mimetype === "application/vnd.ms-excel" ||
            file.originalname.toLowerCase().endsWith(".csv");
        if (isCsv) {
            cb(null, true);
        } else {
            cb(new Error("Only .csv files are accepted"));
        }
    },
});

// multer's own errors (bad file type, too large, missing field) surface
// with no `status`, which the generic error middleware defaults to 500 —
// they're client input errors, so this pins them to 400 instead.
export const uploadCsvSingle = (fieldName: string) =>
    (req: Request, res: Response, next: NextFunction) => {
        uploadCsv.single(fieldName)(req, res, (err: unknown) => {
            if (err) {
                return next(Object.assign(err instanceof Error ? err : new Error(String(err)), { status: 400 }));
            }
            next();
        });
    };
