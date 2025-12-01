package com.neobit.crm.mapper;

import com.neobit.crm.dto.issue.CreateIssueRequest;
import com.neobit.crm.dto.issue.IssueDTO;
import com.neobit.crm.entity.Issue;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface IssueMapper {
    
    IssueDTO toDTO(Issue issue);
    
    List<IssueDTO> toDTOList(List<Issue> issues);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "externalId", ignore = true)
    @Mapping(target = "externalKey", ignore = true)
    @Mapping(target = "status", constant = "todo")
    @Mapping(target = "provider", constant = "internal")
    @Mapping(target = "url", ignore = true)
    @Mapping(target = "resolvedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Issue toEntity(CreateIssueRequest request);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "externalId", ignore = true)
    @Mapping(target = "externalKey", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "provider", ignore = true)
    @Mapping(target = "url", ignore = true)
    @Mapping(target = "resolvedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(CreateIssueRequest request, @MappingTarget Issue issue);
}

