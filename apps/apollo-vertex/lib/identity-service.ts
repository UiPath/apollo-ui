import { z } from "zod";

export interface GroupMember {
  id: string;
  name: string;
  email: string;
}

interface OrgScope {
  baseUrl: string;
  orgName: string;
  orgId: string;
}

export interface FetchGroupMembersOptions extends OrgScope {
  groupId: string;
}

export interface FetchGroupIdByNameOptions extends OrgScope {
  groupName: string;
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

const GroupSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const GroupWithMembersSchema = GroupSchema.extend({
  members: z.array(IdentityGroupMemberSchema),
});

const GroupListSchema = z.array(GroupSchema);

const getGroupListEndpoint = ({ baseUrl, orgName, orgId }: OrgScope) =>
  `${baseUrl}/${orgName}/identity_/api/Group/${orgId}`;

const getGroupEndpoint = ({
  baseUrl,
  orgName,
  orgId,
  groupId,
}: FetchGroupMembersOptions) =>
  `${getGroupListEndpoint({ baseUrl, orgName, orgId })}/${groupId}`;

const getSortName = (displayName: string): string =>
  displayName.split(" ").pop() ?? displayName;

const authedJsonFetch = async (
  url: string,
  accessToken: string,
): Promise<unknown> => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Identity API request failed: ${response.status}`);
  }

  return response.json();
};

export const fetchGroupMembers = async (
  accessToken: string,
  options: FetchGroupMembersOptions,
): Promise<GroupMember[]> => {
  const group = GroupWithMembersSchema.parse(
    await authedJsonFetch(getGroupEndpoint(options), accessToken),
  );

  return group.members
    .filter((member) => member.objectType === "DirectoryUser")
    .map((member) => ({
      id: member.identifier,
      name: member.displayName ?? member.name,
      email: member.email,
    }))
    .toSorted((a, b) => getSortName(a.name).localeCompare(getSortName(b.name)));
};

export const fetchGroupIdByName = async (
  accessToken: string,
  { baseUrl, orgName, orgId, groupName }: FetchGroupIdByNameOptions,
): Promise<string> => {
  const groups = GroupListSchema.parse(
    await authedJsonFetch(
      getGroupListEndpoint({ baseUrl, orgName, orgId }),
      accessToken,
    ),
  );

  const group = groups.find((candidate) => candidate.name === groupName);
  if (!group) {
    throw new Error(`Group "${groupName}" not found in organization ${orgId}`);
  }

  return group.id;
};
