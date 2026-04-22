import { z } from "zod";

export interface GroupMember {
  id: string;
  name: string;
  email: string;
}

export interface FetchGroupMembersOptions {
  baseUrl: string;
  orgName: string;
  orgId: string;
  groupId: string;
}

const IdentityGroupMemberSchema = z.object({
  objectType: z.string(),
  identifier: z.string(),
  name: z.string(),
  email: z.string(),
  displayName: z.string(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  source: z.string().nullish(),
});

const GroupResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  members: z.array(IdentityGroupMemberSchema),
});

const getGroupEndpoint = ({
  baseUrl,
  orgName,
  orgId,
  groupId,
}: FetchGroupMembersOptions) =>
  `${baseUrl}/${orgName}/identity_/api/Group/${orgId}/${groupId}`;

const getSortName = (displayName: string): string =>
  displayName.split(" ").pop() ?? displayName;

export const fetchGroupMembers = async (
  accessToken: string,
  options: FetchGroupMembersOptions,
): Promise<GroupMember[]> => {
  const response = await fetch(getGroupEndpoint(options), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch group members: ${response.status}`);
  }

  const group = GroupResponseSchema.parse(await response.json());

  return group.members
    .filter((member) => member.objectType === "DirectoryUser")
    .map((member) => ({
      id: member.identifier,
      name: member.displayName ?? member.name,
      email: member.email,
    }))
    .toSorted((a, b) => getSortName(a.name).localeCompare(getSortName(b.name)));
};
