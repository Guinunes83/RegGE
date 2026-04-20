
package com.elora.regge.repository;

import com.elora.regge.model.ProtocolDeviation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DeviationRepository extends JpaRepository<ProtocolDeviation, String> {
    List<ProtocolDeviation> findByStudyId(String studyId);
    List<ProtocolDeviation> findByStatus(String status);
}
