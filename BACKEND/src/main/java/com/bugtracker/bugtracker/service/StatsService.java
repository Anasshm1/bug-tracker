package com.bugtracker.bugtracker.service;

import com.bugtracker.bugtracker.dto.StatsDevResponse;
import com.bugtracker.bugtracker.dto.StatsReporterResponse;
import com.bugtracker.bugtracker.dto.UserRankDto;
import com.bugtracker.bugtracker.entity.Ticket;
import com.bugtracker.bugtracker.entity.User;
import com.bugtracker.bugtracker.repository.TicketRepository;
import com.bugtracker.bugtracker.repository.UserRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
public class StatsService {

    private final TicketRepository ticketRepository;
    @Getter
    private final UserRepository userRepository;

    // ────────────────────────────────────────────────────────────
    //  REPORTER
    // ────────────────────────────────────────────────────────────
    public StatsReporterResponse getReporterStats(Long userId) {
        User reporter = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Reporter introuvable"));

        List<Ticket> tickets = ticketRepository.findByReporter(reporter);

        long totalSoumis  = tickets.size();
        long nbEnCours    = tickets.stream().filter(t -> t.getStatus().equalsIgnoreCase("NOUVEAU") 
                                                      || t.getStatus().equalsIgnoreCase("ENCOURS")
                                                      || t.getStatus().equalsIgnoreCase("TRAITE")).count();
        long nbCompletes  = tickets.stream().filter(t -> t.getStatus().equalsIgnoreCase("COMPLETE")).count();
        long nbRetourInfo = tickets.stream().filter(t -> t.getStatus().equalsIgnoreCase("RETOUR_INFO")).count();
        long nbAcceptes   = tickets.stream().filter(t -> t.getStatus().equalsIgnoreCase("ACCEPTE")).count();

        // ── Score Qualité global (sur 100) ──────────────────────
        // Logique :
        //   - Taux d'acceptation : poids 60%
        //   - Taux de rejet (retour info) : poids 40%  → plus c'est bas, mieux c'est
        int scoreQualite;
        String evalGlobale;
        String evalMessage;

        if (totalSoumis == 0) {
            scoreQualite = 0;
            evalGlobale  = "GRIS";
            evalMessage  = "Aucun ticket soumis encore.";
        } else {
            double tauxAcceptation = (double) nbAcceptes / totalSoumis;   // 0..1 (plus c'est haut, mieux c'est)
            double tauxRejet       = (double) nbRetourInfo / totalSoumis;  // 0..1 (plus c'est bas, mieux c'est)

            // Score : 50% sur acceptation + 50% sur absence de rejet
            double scoreBrut = (tauxAcceptation * 50) + ((1.0 - tauxRejet) * 50);
            scoreQualite = (int) Math.round(scoreBrut);
            scoreQualite = Math.max(0, Math.min(100, scoreQualite));

            if (scoreQualite >= 70) {
                evalGlobale = "VERT";
                evalMessage = "Excellente qualité ! Vos tickets sont bien documentés et acceptés.";
            } else if (scoreQualite >= 40) {
                evalGlobale = "JAUNE";
                evalMessage = "Qualité correcte. Essayez de réduire le nombre de retours d'info.";
            } else {
                evalGlobale = "ROUGE";
                evalMessage = "Qualité insuffisante. Vos tickets sont souvent refusés ou nécessitent des informations supplémentaires.";
            }
        }

        // ── Rankings ────────────────────────────────────────────
        LocalDateTime startOfMonth = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime endOfMonth   = YearMonth.now().atEndOfMonth().atTime(23, 59, 59);
        List<Object[]> rankResults = ticketRepository.findTopReportersByAcceptedTickets(startOfMonth, endOfMonth);

        List<UserRankDto> topReporters = new ArrayList<>();
        int myRank = -1;
        for (int i = 0; i < rankResults.size(); i++) {
            User u     = (User) rankResults.get(i)[0];
            long count = (long) rankResults.get(i)[1];
            if (i < 3) topReporters.add(new UserRankDto(u.getFullName(), count));
            if (u.getId().equals(userId)) myRank = i + 1;
        }

        return StatsReporterResponse.builder()
                .totalSoumis(totalSoumis)
                .nbEnCours(nbEnCours)
                .nbCompletes(nbCompletes)
                .nbAcceptes(nbAcceptes)
                .nbRetourInfo(nbRetourInfo)
                .evalGlobale(evalGlobale)
                .evalMessage(evalMessage)
                .scoreQualite(scoreQualite)
                .rangMensuel(myRank)
                .topReporters(topReporters)
                .build();
    }

    // ────────────────────────────────────────────────────────────
    //  DÉVELOPPEUR
    // ────────────────────────────────────────────────────────────
    public StatsDevResponse getDevStats(Long userId) {
        User dev = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Développeur introuvable"));

        List<Ticket> tickets = ticketRepository.findByAssignedTo(dev);

        long totalAssignes = tickets.size();
        long nbAcceptes    = tickets.stream().filter(t -> t.getStatus().equalsIgnoreCase("ACCEPTE")).count();
        long nbRetourInfo  = tickets.stream().filter(t -> t.getStatus().equalsIgnoreCase("RETOUR_INFO")).count();
        long nbTraites     = tickets.stream().filter(t -> t.getStatus().equalsIgnoreCase("TRAITE") || t.getStatus().equalsIgnoreCase("COMPLETE") || t.getStatus().equalsIgnoreCase("RESOLU")).count();
        long nbEnAttente   = totalAssignes - nbTraites - nbRetourInfo;

        // ── Score Qualité global (sur 100) ──────────────────────
        // Logique (confirmée) :
        //   Un bon dev challenge les tickets (retour d'info), donc un fort ratio retour/accepté = VERT
        //   ROUGE si accepte tout sans jamais challenger
        //   Score = 50% taux traitement + 50% ratio challenge (retourInfo / traites)
        int scoreQualite;
        String evalGlobale;
        String evalMessage;

        if (totalAssignes == 0) {
            scoreQualite = 0;
            evalGlobale  = "GRIS";
            evalMessage  = "Aucun ticket assigné encore.";
        } else {
            // Un ticket est "pris en charge" s'il n'est plus simplement assigné (c-a-d Accepté, Traité ou Retour Info)
            long nbPrisEnCharge = nbAcceptes + nbTraites + nbRetourInfo;
            
            // 1. Taux de prise en charge (réactivité) -> 50% du score
            double tauxPriseEnCharge = (double) nbPrisEnCharge / totalAssignes;       // 0..1
            
            // 2. Ratio de challenge -> 50% du score
            // Combien de tickets ont été challengés parmi ceux pris en charge ?
            // On s'attend à un minimum de challenge (par ex. 20% de retour info = score max sur cette partie pour ne pas forcer à tout refuser)
            double ratioChallenge = 0.0;
            if (nbPrisEnCharge > 0) {
                double challengeActuel = (double) nbRetourInfo / nbPrisEnCharge;
                // Si le dev challenge au moins 20% des tickets, il a le max de points de rigueur (1.0)
                // Sinon, c'est proportionnel.
                ratioChallenge = Math.min(challengeActuel / 0.20, 1.0);
            }

            double scoreBrut = (tauxPriseEnCharge * 50) + (ratioChallenge * 50);
            scoreQualite = (int) Math.round(scoreBrut);
            scoreQualite = Math.max(0, Math.min(100, scoreQualite));

            if (scoreQualite >= 75) {
                evalGlobale = "VERT";
                evalMessage = "Excellente rigueur ! Vous prenez vite en charge et challengez les tickets.";
            } else if (scoreQualite >= 40) {
                evalGlobale = "JAUNE";
                evalMessage = "Rigueur correcte. Pensez à vérifier et challenger davantage les tickets reçus.";
            } else {
                evalGlobale = "ROUGE";
                evalMessage = "Attention ! Vous acceptez les tickets sans vérification préalable ou ne les traitez pas.";
            }
        }

        // ── Rankings ────────────────────────────────────────────
        LocalDateTime startOfMonth = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime endOfMonth   = YearMonth.now().atEndOfMonth().atTime(23, 59, 59);
        List<Object[]> rankResults = ticketRepository.findTopDevsByAcceptedTickets(startOfMonth, endOfMonth);

        List<UserRankDto> topDevs = new ArrayList<>();
        int myRank = -1;
        for (int i = 0; i < rankResults.size(); i++) {
            User u     = (User) rankResults.get(i)[0];
            long count = (long) rankResults.get(i)[1];
            if (i < 3) topDevs.add(new UserRankDto(u.getFullName(), count));
            if (u.getId().equals(userId)) myRank = i + 1;
        }

        return StatsDevResponse.builder()
                .totalAssignes(totalAssignes)
                .nbTraites(nbTraites)
                .nbEnAttente(nbEnAttente)
                .nbAcceptes(nbAcceptes)
                .nbRetourInfo(nbRetourInfo)
                .evalGlobale(evalGlobale)
                .evalMessage(evalMessage)
                .scoreQualite(scoreQualite)
                .rangMensuel(myRank)
                .topDevs(topDevs)
                .build();
    }
}
