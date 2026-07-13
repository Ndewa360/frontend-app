import { Component, OnInit } from '@angular/core';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  image: string;
  socialLinks: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  experience?: string;
}

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})
export class TeamComponent implements OnInit {

  teamMembers: TeamMember[] = [
    {
      id: 'cedric-nguendap',
      name: 'Cédric Nguendap',
      position: 'CEO',
      image: 'assets/team/cedric-nguendap.jpg',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/cedric-nguendap-bedjama-143544175/',
        facebook: 'https://www.facebook.com/cedric.nguendap.77',
        twitter: 'https://x.com/c_nguendap'
      },
      // experience: '8+ ans'
    },
    {
      id: 'kell-momo',
      name: 'Kell Momo',
      position: 'CMO',
      image: 'assets/team/kell-momo.jpg',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/kell-momo',
        facebook: 'https://www.facebook.com/profile.php?id=100077568106642',
        // twitter: 'https://twitter.com/kell_momo',
        // instagram: 'https://instagram.com/kell.momo'
      },
      // experience: '10+ ans'
    },
    {
      id: 'konguep-elvira',
      name: 'Konguep Elvira',
      position: 'CFO',
      image: 'assets/team/konguep-elvira.jpg',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/elvira-konguep-43951422a/',
        facebook: 'https://www.facebook.com/elvira.konguep',
        // twitter: 'https://twitter.com/konguep_elvira'
      },
      // experience: '7+ ans'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  openSocialLink(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }
}