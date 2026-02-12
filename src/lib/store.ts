// In-memory data store using seed data
// This provides immediate functionality without requiring MongoDB setup
// The API routes are structured to easily swap to MongoDB later

import { Event, Project, Member, Vote, Comment, ROLE_WEIGHTS } from "@/types";
import {
  seedEvents,
  seedProjects,
  seedMembers,
  seedVotes,
  seedComments,
} from "./seed-data";

class DataStore {
  events: Event[] = [...seedEvents];
  projects: Project[] = [...seedProjects];
  members: Member[] = [...seedMembers];
  votes: Vote[] = [...seedVotes];
  comments: Comment[] = [...seedComments];
  currentUserId: string | null = "m1"; // Default logged-in user for demo

  // Events
  getEvents(): Event[] {
    return this.events;
  }

  getEvent(id: string): Event | undefined {
    return this.events.find((e) => e._id === id);
  }

  // Projects
  getProjects(options?: {
    sort?: "trending" | "newest";
    eventId?: string;
    category?: string;
    search?: string;
    week?: number;
  }): Project[] {
    let results = [...this.projects];

    if (options?.eventId) {
      results = results.filter((p) => p.event === options.eventId);
    }
    if (options?.category) {
      results = results.filter((p) => p.category === options.category);
    }
    if (options?.week) {
      results = results.filter((p) => p.weekSubmitted === options.week);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.team.some((t) => t.name.toLowerCase().includes(q))
      );
    }

    // Attach event data
    results = results.map((p) => ({
      ...p,
      eventData: this.events.find((e) => e._id === p.event),
    }));

    if (options?.sort === "newest") {
      results.sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    } else {
      // Default: trending (by weighted score)
      results.sort((a, b) => b.weightedScore - a.weightedScore);
    }

    return results;
  }

  getProject(id: string): (Project & { eventData?: Event }) | undefined {
    const project = this.projects.find((p) => p._id === id);
    if (!project) return undefined;
    return {
      ...project,
      eventData: this.events.find((e) => e._id === project.event),
    };
  }

  createProject(
    data: Omit<Project, "_id" | "weightedScore" | "rawVotes" | "submittedAt" | "weekSubmitted">
  ): Project {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor(
      (now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
    );
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);

    const project: Project = {
      ...data,
      _id: `p${Date.now()}`,
      weightedScore: 0,
      rawVotes: 0,
      submittedAt: now.toISOString(),
      weekSubmitted: week,
    };
    this.projects.push(project);

    // Update event project count
    const event = this.events.find((e) => e._id === project.event);
    if (event) event.projectCount++;

    // Upgrade submitter to builder if not already
    for (const teamMember of project.team) {
      const member = this.members.find((m) => m._id === teamMember.memberId);
      if (member && member.role === "member") {
        member.role = "builder";
      }
      if (member) {
        member.projectsShipped++;
      }
    }

    return project;
  }

  // Votes
  getVotesForProject(projectId: string): Vote[] {
    return this.votes.filter((v) => v.projectId === projectId);
  }

  hasVoted(projectId: string, memberId: string): boolean {
    return this.votes.some(
      (v) => v.projectId === projectId && v.memberId === memberId
    );
  }

  getUserVotedProjectIds(memberId: string): string[] {
    return this.votes
      .filter((v) => v.memberId === memberId)
      .map((v) => v.projectId);
  }

  vote(projectId: string, memberId: string): Vote | null {
    if (this.hasVoted(projectId, memberId)) return null;

    const member = this.members.find((m) => m._id === memberId);
    const role = member?.role || "nonmember";
    const weight = ROLE_WEIGHTS[role] || 1;

    const vote: Vote = {
      _id: `v${Date.now()}`,
      projectId,
      memberId,
      role,
      weight,
      createdAt: new Date().toISOString(),
    };
    this.votes.push(vote);

    // Update project scores
    const project = this.projects.find((p) => p._id === projectId);
    if (project) {
      project.rawVotes++;
      project.weightedScore += weight;
    }

    // Update member total weighted votes
    if (member) {
      member.totalWeightedVotes += weight;
    }

    return vote;
  }

  removeVote(projectId: string, memberId: string): boolean {
    const voteIndex = this.votes.findIndex(
      (v) => v.projectId === projectId && v.memberId === memberId
    );
    if (voteIndex === -1) return false;

    const vote = this.votes[voteIndex];
    this.votes.splice(voteIndex, 1);

    const project = this.projects.find((p) => p._id === projectId);
    if (project) {
      project.rawVotes--;
      project.weightedScore -= vote.weight;
    }

    const member = this.members.find((m) => m._id === memberId);
    if (member) {
      member.totalWeightedVotes -= vote.weight;
    }

    return true;
  }

  // Comments
  getCommentsForProject(projectId: string): Comment[] {
    return this.comments
      .filter((c) => c.projectId === projectId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }

  addComment(
    projectId: string,
    memberId: string,
    content: string,
    parentId?: string
  ): Comment | null {
    const member = this.members.find((m) => m._id === memberId);
    if (!member) return null;

    const comment: Comment = {
      _id: `c${Date.now()}`,
      projectId,
      memberId,
      memberName: member.name,
      memberAvatar: member.avatar,
      content,
      parentId,
      createdAt: new Date().toISOString(),
    };
    this.comments.push(comment);
    return comment;
  }

  // Members
  getMembers(): Member[] {
    return this.members;
  }

  getMember(id: string): Member | undefined {
    return this.members.find((m) => m._id === id);
  }

  getMemberProjects(memberId: string): Project[] {
    return this.projects.filter((p) =>
      p.team.some((t) => t.memberId === memberId)
    );
  }

  getBuilderLeaderboard(timeFilter?: "all" | "month" | "week"): Member[] {
    const members = [...this.members].filter((m) => m.builderScore > 0);

    if (timeFilter === "week" || timeFilter === "month") {
      // For time-filtered views, recalculate based on recent votes
      const now = new Date();
      const cutoff = new Date();
      if (timeFilter === "week") {
        cutoff.setDate(now.getDate() - 7);
      } else {
        cutoff.setMonth(now.getMonth() - 1);
      }

      // Still show all members but sort by recent activity
      // In production, this would be a proper time-windowed calculation
    }

    return members.sort((a, b) => b.builderScore - a.builderScore);
  }

  // Cities
  getCityLeaderboard(): Array<{
    city: string;
    projectCount: number;
    totalScore: number;
  }> {
    const cityMap = new Map<
      string,
      { projectCount: number; totalScore: number }
    >();

    for (const project of this.projects) {
      let city = "Unknown";
      if (project.event) {
        const event = this.events.find((e) => e._id === project.event);
        city = event?.city || "Unknown";
      } else if (project.team.length > 0) {
        const firstMember = this.members.find(
          (m) => m._id === project.team[0].memberId
        );
        city = firstMember?.city || "Unknown";
      }
      if (city === "All Cities" || city === "Unknown") continue;

      const existing = cityMap.get(city) || {
        projectCount: 0,
        totalScore: 0,
      };
      existing.projectCount++;
      existing.totalScore += project.weightedScore;
      cityMap.set(city, existing);
    }

    return Array.from(cityMap.entries())
      .map(([city, data]) => ({ city, ...data }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  // Timeline
  getWeeklyTimeline(): Array<{
    week: number;
    count: number;
    projects: string[];
  }> {
    const weekMap = new Map<number, { count: number; projects: string[] }>();

    for (const project of this.projects) {
      const week = project.weekSubmitted;
      const existing = weekMap.get(week) || { count: 0, projects: [] };
      existing.count++;
      existing.projects.push(project.name);
      weekMap.set(week, existing);
    }

    return Array.from(weekMap.entries())
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week - b.week);
  }

  // Current user helpers
  getCurrentUser(): Member | null {
    if (!this.currentUserId) return null;
    return this.members.find((m) => m._id === this.currentUserId) || null;
  }

  setCurrentUser(memberId: string | null) {
    this.currentUserId = memberId;
  }
}

// Singleton store
const globalStore = globalThis as typeof globalThis & { __store?: DataStore };
if (!globalStore.__store) {
  globalStore.__store = new DataStore();
}

export const store: DataStore = globalStore.__store;
