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
  experience: string;
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
      position: 'CTO',
      image: 'assets/team/cedric-nguendap.jpg',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/cedric-nguendap',
        facebook: 'https://facebook.com/cedric.nguendap',
        twitter: 'https://twitter.com/cedric_nguendap'
      },
      experience: '8+ ans'
    },
    {
      id: 'wawo-domguia',
      name: 'Wawo Domguia',
      position: 'CEO',
      image: 'assets/team/wawo-domguia.jpg',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/wawo-domguia',
        facebook: 'https://facebook.com/wawo.domguia',
        twitter: 'https://twitter.com/wawo_domguia',
        instagram: 'https://instagram.com/wawo.domguia'
      },
      experience: '10+ ans'
    },
    {
      id: 'konguep-elvira',
      name: 'Konguep Elvira',
      position: 'CFO',
      image: 'assets/team/konguep-elvira.jpg',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/konguep-elvira',
        facebook: 'https://facebook.com/konguep.elvira',
        twitter: 'https://twitter.com/konguep_elvira'
      },
      experience: '7+ ans'
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