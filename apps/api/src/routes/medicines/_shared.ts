import * as v from "valibot";

export type Bindings = {
  DATABASE_URL: string;
};

export type Variables = {
  userId: string;
};

export type MedicinesEnv = { Bindings: Bindings; Variables: Variables };

//Todo: 汎用的な定数はここで良いのか検討する
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const TimingSchema = v.picklist(["morning", "afternoon", "evening"]);

export type Timing = v.InferOutput<typeof TimingSchema>;
