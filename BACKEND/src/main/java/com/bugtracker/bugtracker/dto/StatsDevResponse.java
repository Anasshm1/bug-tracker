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
public class StatsDevResponse {
    private long totalAssignes;
    private long nbTraites;
    private long nbEnAttente;
    private long nbAcceptes;
    private long nbRetourInfo;
    
    private int rangMensuel;
    private List<UserRankDto> topDevs;

    // UNE seule évaluation globale ("ROUGE", "JAUNE", "VERT", "GRIS")
    private String evalGlobale;
    private String evalMessage;  // Message explicatif
    private int scoreQualite;    // Score sur 100 pour le disque de pourcentage
}
