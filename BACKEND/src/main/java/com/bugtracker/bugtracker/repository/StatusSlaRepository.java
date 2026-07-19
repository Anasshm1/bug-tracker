package com.bugtracker.bugtracker.repository;

import com.bugtracker.bugtracker.entity.StatusSla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StatusSlaRepository extends JpaRepository<StatusSla, String> {
}
