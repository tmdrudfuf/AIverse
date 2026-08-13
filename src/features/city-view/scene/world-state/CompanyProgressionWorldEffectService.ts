import type { CompanyProgressionTrigger } from "../office/progression/CompanyProgressionTypes";
import type { CompanyProgressionWorldEffect } from "./WorldStateTypes";
import { copyWorldEffectState } from "./WorldStateTypes";

export type CompanyProgressionWorldEffectInput = {
  triggers: ReadonlyArray<CompanyProgressionTrigger>;
};

export class CompanyProgressionWorldEffectService {
  createEffects(input: CompanyProgressionWorldEffectInput): CompanyProgressionWorldEffect[] {
    return input.triggers.map(createCompanyProgressionWorldEffect).map(copyWorldEffectState);
  }
}

function createCompanyProgressionWorldEffect(trigger: CompanyProgressionTrigger): CompanyProgressionWorldEffect {
  return {
    effectId: `${trigger.triggerId}:world-effect`,
    effectType: "company_progression_level_reached",
    source: "company_progression",
    triggerId: trigger.triggerId,
    fromLevel: trigger.fromLevel,
    toLevel: trigger.toLevel,
    companyStage: trigger.companyStage,
    layoutId: trigger.layoutId,
    floorCount: trigger.floorCount,
    maxEmployees: trigger.maxEmployees,
    unlockedOfficeZones: [...trigger.unlockedOfficeZones],
    milestoneIds: trigger.milestones.map((milestone) => milestone.milestoneId),
  };
}
