package com.bugtracker.bugtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsReporterResponse {
    private long totalSoumis;
    private long nbEnCours;
    private long nbCompletes;
    private long nbAcceptes;
    private long nbRetourInfo;
    
    private int rangMensuel;
    private List<UserRankDto> topReporters;

    // UNE seule évaluation globale ("ROUGE", "JAUNE", "VERT", "GRIS")
    private String evalGlobale;
    private String evalMessage;  // Message explicatif
    private int scoreQualite;    // Score sur 100 pour le disque de pourcentage
}
