import {
  Project,
  BuildingProject,
  BuilderProfile,
  CityData,
  ThreadData,
  Comment,
  Vote,
  ROLE_WEIGHTS,
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
  comments: Comment[] = [];
  votes: Vote[] = [];
  currentUser: BuilderProfile | null = null;
  private nextProjectId = 100;
  private nextCommentId = 1;

  // --- Auth ---
  setCurrentUser(name: string | null): BuilderProfile | null {
    if (!name) {
      this.currentUser = null;
      return null;
    }
    const builder = this.builders.find((b) => b.name === name) || null;
    this.currentUser = builder;
    return builder;
  }

  getCurrentUser(): BuilderProfile | null {
    return this.currentUser;
  }

  // --- Projects ---
  getProjects(): Project[] {
    return [...this.projects].sort((a, b) => b.weighted - a.weighted);
  }

  getProject(id: number): Project | undefined {
    return this.projects.find((p) => p.id === id);
  }

  createProject(data: {
    name: string;
    tagline: string;
    description: string;
    category: string;
    stack: string[];
    buildathon?: string;
  }): Project | null {
    if (!this.currentUser) return null;

    const heroColors = ["#2255CC", "#7C3AED", "#059669", "#DC2626", "#2563EB", "#B45309"];
    const project: Project = {
      id: this.nextProjectId++,
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      builder: {
        name: this.currentUser.name,
        avatar: this.currentUser.avatar,
        city: this.currentUser.city,
        title: this.currentUser.role,
        company: undefined,
        companyColor: undefined,
      },
      collabs: [],
      weighted: 0,
      raw: 0,
      category: data.category || "SaaS",
      stack: data.stack || [],
      buildathon: data.buildathon || null,
      heroColor: heroColors[this.nextProjectId % heroColors.length],
      featured: false,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      gallery: [],
    };
    this.projects.push(project);
    return project;
  }

  // --- Voting ---
  hasVoted(projectId: number, builderName: string): boolean {
    return this.votes.some(
      (v) => v.projectId === projectId && v.builderName === builderName
    );
  }

  vote(projectId: number): { voted: boolean; weighted: number; raw: number } | null {
    if (!this.currentUser) return null;
    const project = this.getProject(projectId);
    if (!project) return null;

    const name = this.currentUser.name;
    const weight = ROLE_WEIGHTS[this.currentUser.role] || 1;

    if (this.hasVoted(projectId, name)) {
      // Remove vote
      const existing = this.votes.find(
        (v) => v.projectId === projectId && v.builderName === name
      );
      this.votes = this.votes.filter(
        (v) => !(v.projectId === projectId && v.builderName === name)
      );
      project.raw -= 1;
      project.weighted -= existing?.weight || weight;
      return { voted: false, weighted: project.weighted, raw: project.raw };
    }

    // Add vote
    this.votes.push({ projectId, builderName: name, weight });
    project.raw += 1;
    project.weighted += weight;
    return { voted: true, weighted: project.weighted, raw: project.raw };
  }

  getVotedProjectIds(builderName: string): number[] {
    return this.votes
      .filter((v) => v.builderName === builderName)
      .map((v) => v.projectId);
  }

  // --- Comments ---
  getCommentsForProject(projectId: number): Comment[] {
    return this.comments
      .filter((c) => c.projectId === projectId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  addComment(
    projectId: number,
    content: string,
    parentId: string | null = null
  ): Comment | null {
    if (!this.currentUser) return null;

    const comment: Comment = {
      id: `c${this.nextCommentId++}`,
      projectId,
      authorName: this.currentUser.name,
      authorAvatar: this.currentUser.avatar,
      authorRole: this.currentUser.role,
      content,
      parentId,
      createdAt: new Date().toISOString(),
    };
    this.comments.push(comment);
    return comment;
  }

  // --- Building ---
  getBuilding(): BuildingProject[] {
    return this.building;
  }

  // --- Builders ---
  getBuilders(): BuilderProfile[] {
    return [...this.builders].sort((a, b) => b.rep - a.rep);
  }

  // --- Cities ---
  getCities(): CityData[] {
    return [...this.cities].sort((a, b) => b.builders - a.builders);
  }

  // --- Threads ---
  getThreads(): ThreadData[] {
    return this.threads;
  }
}

const globalStore = globalThis as typeof globalThis & { __store?: DataStore };
if (!globalStore.__store) {
  globalStore.__store = new DataStore();
}

export const store: DataStore = globalStore.__store;
