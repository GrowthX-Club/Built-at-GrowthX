import {
  Project,
  BuildingProject,
  BuilderProfile,
  CityData,
  ThreadData,
} from "@/types";
import {
  seedProjects,
  seedBuilding,
  seedBuilders,
  seedCities,
  seedThreads,
} from "./seed-data";

class DataStore {
  projects: Project[] = [...seedProjects];
  building: BuildingProject[] = [...seedBuilding];
  builders: BuilderProfile[] = [...seedBuilders];
  cities: CityData[] = [...seedCities];
  threads: ThreadData[] = [...seedThreads];

  getProjects(): Project[] {
    return this.projects.sort((a, b) => b.weighted - a.weighted);
  }

  getProject(id: number): Project | undefined {
    return this.projects.find((p) => p.id === id);
  }

  getBuilding(): BuildingProject[] {
    return this.building;
  }

  getBuilders(): BuilderProfile[] {
    return this.builders.sort((a, b) => b.rep - a.rep);
  }

  getCities(): CityData[] {
    return this.cities.sort((a, b) => b.builders - a.builders);
  }

  getThreads(): ThreadData[] {
    return this.threads;
  }
}

const globalStore = globalThis as typeof globalThis & { __store?: DataStore };
if (!globalStore.__store) {
  globalStore.__store = new DataStore();
}

export const store: DataStore = globalStore.__store;
